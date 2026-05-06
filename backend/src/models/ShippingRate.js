const mongoose = require('mongoose');

/**
 * ShippingRate — defines pricing rules for each carrier/method.
 *
 * Pricing logic (applied in order):
 *  1. If product has shippingClass = "free"  → ETB 0
 *  2. If product has a shippingOverrides[carrierId] → use that fixed price
 *  3. Otherwise: basePrice + (weightKg * pricePerKg)
 *     with optional min/max caps
 */
const shippingRateSchema = new mongoose.Schema(
  {
    carrierId: {
      type: String,
      required: true,
      unique: true,
      // e.g. "ups_expedited", "dhl_standard", "dhl_express"
    },
    carrierName: { type: String, required: true },
    etaMin: { type: Number, default: 1 },  // business days
    etaMax: { type: Number, default: 7 },
    currency: { type: String, default: 'ETB' },

    // Base price charged regardless of weight
    basePrice: { type: Number, default: 0 },

    // Additional price per kg
    pricePerKg: { type: Number, default: 0 },

    // Minimum and maximum shipping charge
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 }, // 0 = no cap

    // Class-specific multipliers (applied on top of base calculation)
    classMultipliers: {
      standard: { type: Number, default: 1.0 },
      bulky:    { type: Number, default: 1.5 },
      fragile:  { type: Number, default: 1.3 },
      free:     { type: Number, default: 0.0 },
      no_shipping: { type: Number, default: 0.0 },
    },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShippingRate', shippingRateSchema);
