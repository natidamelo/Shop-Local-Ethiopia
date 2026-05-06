const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/email');

const chapaWebhookHandler = async (req, res) => {
  // Chapa sends a POST with the transaction reference
  const { trx_ref, status } = req.body;

  try {
    if (status === 'success' && trx_ref) {
      const payment = await Payment.findOneAndUpdate(
        { gatewayReference: trx_ref },
        { status: 'completed', paidAt: new Date(), webhookData: req.body },
        { new: true }
      );

      if (payment) {
        const order = await Order.findByIdAndUpdate(
          payment.order,
          {
            paymentStatus: 'paid',
            status: 'confirmed',
            $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via Chapa' } },
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
    }
  } catch (err) {
    console.error('Chapa webhook error:', err);
  }

  res.status(200).json({ status: 'received' });
};

module.exports = chapaWebhookHandler;
