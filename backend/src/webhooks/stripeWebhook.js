function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('your_stripe')) return null;
  // Lazily create Stripe client so missing keys don't crash the server on startup
  return require('stripe')(key);
}
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/email');

const stripeWebhookHandler = async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    // Don't crash production if Stripe isn't configured; respond so webhook retries don't loop forever
    return res.status(503).json({ received: false, message: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const payment = await Payment.findOneAndUpdate(
          { gatewayTransactionId: intent.id },
          { status: 'completed', paidAt: new Date(), webhookData: intent },
          { new: true }
        );

        if (payment) {
          const order = await Order.findByIdAndUpdate(
            payment.order,
            {
              paymentStatus: 'paid',
              status: 'confirmed',
              $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via Stripe' } },
            },
            { new: true }
          );

          if (order) {
            const user = await User.findById(payment.user);
            await User.findByIdAndUpdate(user._id, { $inc: { totalSpent: order.total } });
            try {
              await sendOrderConfirmationEmail(user, order);
            } catch {}
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await Payment.findOneAndUpdate(
          { gatewayTransactionId: intent.id },
          {
            status: 'failed',
            failureReason: intent.last_payment_error?.message || 'Payment failed',
            webhookData: intent,
          }
        );
        await Order.findOneAndUpdate(
          { paymentId: { $exists: true } },
          { paymentStatus: 'failed' }
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        await Payment.findOneAndUpdate(
          { gatewayTransactionId: charge.payment_intent },
          { status: 'refunded', refundedAt: new Date(), refundAmount: charge.amount_refunded / 100 }
        );
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
  }

  res.json({ received: true });
};

module.exports = stripeWebhookHandler;
