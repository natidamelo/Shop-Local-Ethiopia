const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['adjustment', 'sale', 'return', 'restock', 'reservation', 'release', 'correction', 'initial'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: '' },
    reference: {
      model: { type: String, enum: ['Order', 'User', 'Product', ''], default: '' },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    variant: { type: String, default: '' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
