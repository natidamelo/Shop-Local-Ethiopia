const ShippingRate = require('../models/ShippingRate');
const Product = require('../models/Product');

// Default carriers seeded if none exist
const DEFAULT_RATES = [
  {
    carrierId: 'ups_expedited',
    carrierName: 'UPS Worldwide Expedited®',
    etaMin: 4,
    etaMax: 4,
    currency: 'ETB',
    basePrice: 6000,
    pricePerKg: 800,
    minPrice: 6000,
    maxPrice: 0,
    classMultipliers: { standard: 1.0, bulky: 1.5, fragile: 1.3, free: 0.0, no_shipping: 0.0 },
    isActive: true,
    sortOrder: 1,
  },
  {
    carrierId: 'dhl_standard',
    carrierName: 'DHL eCommerce Parcel Standard',
    etaMin: 11,
    etaMax: 19,
    currency: 'ETB',
    basePrice: 8000,
    pricePerKg: 900,
    minPrice: 8000,
    maxPrice: 0,
    classMultipliers: { standard: 1.0, bulky: 1.5, fragile: 1.3, free: 0.0, no_shipping: 0.0 },
    isActive: true,
    sortOrder: 2,
  },
  {
    carrierId: 'dhl_express',
    carrierName: 'DHL Express Worldwide',
    etaMin: 3,
    etaMax: 4,
    currency: 'ETB',
    basePrice: 14000,
    pricePerKg: 1500,
    minPrice: 14000,
    maxPrice: 0,
    classMultipliers: { standard: 1.0, bulky: 1.5, fragile: 1.3, free: 0.0, no_shipping: 0.0 },
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * Calculate shipping price for a carrier + cart items.
 *
 * Logic per carrier:
 *  1. If ALL items have shippingClass "free" → ETB 0
 *  2. For each item: if shippingOverrides[carrierId] exists → use it × quantity
 *     else → weight-based: (basePrice + weight * pricePerKg) * classMultiplier
 *  3. Take the MAX item shipping cost (not sum) — standard practice for mixed carts
 *  4. Clamp to minPrice / maxPrice
 */
const calculateShippingForCarrier = (rate, cartItems) => {
  if (!rate.isActive) return null;

  // All free → 0
  const allFree = cartItems.every((i) => i.shippingClass === 'free');
  if (allFree) return 0;

  // Any no_shipping item → carrier not available
  const hasNoShipping = cartItems.some((i) => i.shippingClass === 'no_shipping');
  if (hasNoShipping) return null;

  let totalCost = 0;

  for (const item of cartItems) {
    const qty = item.quantity || 1;
    const overrideKey = item.shippingOverrides?.[rate.carrierId];

    let itemCost;
    if (overrideKey != null && overrideKey > 0) {
      // Fixed override per item (multiply by quantity)
      itemCost = overrideKey * qty;
    } else {
      // Weight-based
      const weightKg = (item.weight || 0) * qty;
      const multiplier = rate.classMultipliers?.[item.shippingClass || 'standard'] ?? 1.0;
      const raw = (rate.basePrice + weightKg * rate.pricePerKg) * multiplier;
      itemCost = raw;
    }

    totalCost += itemCost;
  }

  // Apply min/max
  if (rate.minPrice > 0) totalCost = Math.max(totalCost, rate.minPrice);
  if (rate.maxPrice > 0) totalCost = Math.min(totalCost, rate.maxPrice);

  return Math.round(totalCost);
};

// @GET /api/shipping/rates?items=productId:qty,productId:qty
const getShippingRates = async (req, res, next) => {
  try {
    // Ensure defaults exist
    const count = await ShippingRate.countDocuments();
    if (count === 0) {
      await ShippingRate.insertMany(DEFAULT_RATES);
    }

    const rates = await ShippingRate.find({ isActive: true }).sort({ sortOrder: 1 });

    // If items query param provided, calculate prices
    let cartItems = [];
    if (req.query.items) {
      const pairs = req.query.items.split(',');
      for (const pair of pairs) {
        const [productId, qty] = pair.split(':');
        if (!productId) continue;
        const product = await Product.findById(productId.trim()).select('weight shippingClass shippingOverrides');
        if (product) {
          cartItems.push({
            productId,
            quantity: parseInt(qty) || 1,
            weight: product.weight || 0,
            shippingClass: product.shippingClass || 'standard',
            shippingOverrides: product.shippingOverrides ? Object.fromEntries(product.shippingOverrides) : {},
          });
        }
      }
    }

    const result = rates.map((rate) => {
      const r = rate.toObject();
      if (cartItems.length > 0) {
        r.calculatedPrice = calculateShippingForCarrier(rate, cartItems);
      }
      return r;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @GET /api/shipping/calculate  (body: { items: [{productId, quantity}] })
const calculateShipping = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const count = await ShippingRate.countDocuments();
    if (count === 0) {
      await ShippingRate.insertMany(DEFAULT_RATES);
    }

    const rates = await ShippingRate.find({ isActive: true }).sort({ sortOrder: 1 });

    // Enrich items with product shipping data
    const cartItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).select('weight shippingClass shippingOverrides');
      if (product) {
        cartItems.push({
          productId: item.productId,
          quantity: item.quantity || 1,
          weight: product.weight || 0,
          shippingClass: product.shippingClass || 'standard',
          shippingOverrides: product.shippingOverrides ? Object.fromEntries(product.shippingOverrides) : {},
        });
      }
    }

    const result = rates
      .map((rate) => {
        const price = calculateShippingForCarrier(rate, cartItems);
        if (price === null) return null; // carrier not available for this cart
        return {
          carrierId: rate.carrierId,
          carrierName: rate.carrierName,
          etaMin: rate.etaMin,
          etaMax: rate.etaMax,
          currency: rate.currency,
          price,
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ── Admin CRUD ──────────────────────────────────────────────────────────────

// @GET /api/shipping/admin/rates
const adminGetRates = async (req, res, next) => {
  try {
    const count = await ShippingRate.countDocuments();
    if (count === 0) await ShippingRate.insertMany(DEFAULT_RATES);
    const rates = await ShippingRate.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/shipping/admin/rates/:id
const adminUpdateRate = async (req, res, next) => {
  try {
    const rate = await ShippingRate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rate) return res.status(404).json({ success: false, message: 'Rate not found' });
    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @POST /api/shipping/admin/rates
const adminCreateRate = async (req, res, next) => {
  try {
    const rate = await ShippingRate.create(req.body);
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/shipping/admin/rates/:id
const adminDeleteRate = async (req, res, next) => {
  try {
    await ShippingRate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rate deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShippingRates,
  calculateShipping,
  adminGetRates,
  adminUpdateRate,
  adminCreateRate,
  adminDeleteRate,
  calculateShippingForCarrier,
};
