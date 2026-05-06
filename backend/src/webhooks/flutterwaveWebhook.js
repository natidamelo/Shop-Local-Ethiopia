const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/email');

const flutterwaveWebhookHandler = async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_KEY;
  const signature = req.headers['verif-hash'];

  if (!signature || signature !== secretHash) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = req.body;

  try {
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const txRef = payload.data.tx_ref;

      const payment = await Payment.findOneAndUpdate(
        { gatewayReference: txRef },
        {
          status: 'completed',
          gatewayTransactionId: payload.data.id.toString(),
          paidAt: new Date(),
          webhookData: payload.data,
        },
        { new: true }
      );

      if (payment) {
        const order = await Order.findByIdAndUpdate(
          payment.order,
          {
            paymentStatus: 'paid',
            status: 'confirmed',
            $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via Flutterwave' } },
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
    console.error('Flutterwave webhook error:', err);
  }

  res.status(200).json({ status: 'success' });
};

module.exports = flutterwaveWebhookHandler;
