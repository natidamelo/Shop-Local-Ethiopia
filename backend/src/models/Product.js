const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  options: [
    {
      value: String,
      price: Number,
      stock: Number,
      sku: String,
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    type: {
      type: String,
      enum: ['physical', 'digital', 'service', 'subscription'],
      default: 'physical',
    },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0 },
    currency: { type: String, enum: ['ETB', 'USD'], default: 'ETB' },
    images: [{ type: String }],
    thumbnail: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },
    sku: { type: String, default: '' },
    weight: { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'bulky', 'fragile', 'free', 'no_shipping'],
      default: 'standard',
    },
    // Per-carrier fixed price overrides (keyed by carrier id, e.g. "ups_expedited": 8257)
    shippingOverrides: {
      type: Map,
      of: Number,
      default: {},
    },
    variants: [variantSchema],
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, default: '' },
        image: { type: String, default: '' },
      },
    ],
    digitalFile: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

productSchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stock - this.reservedStock);
});

productSchema.virtual('stockStatus').get(function () {
  if (this.type !== 'physical' || !this.trackInventory) return 'not_tracked';
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
