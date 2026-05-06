const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gateway: {
      type: String,
      enum: ['stripe', 'paypal', 'flutterwave', 'chapa'],
      required: true,
    },
    gatewayTransactionId: { type: String, default: '' },
    gatewayReference: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    webhookData: { type: mongoose.Schema.Types.Mixed, default: {} },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    refundedAt: { type: Date },
    paidAt: { type: Date },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
