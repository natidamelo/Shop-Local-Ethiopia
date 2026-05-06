const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const ShippingRate = require('../models/ShippingRate');
const { sendOrderConfirmationEmail } = require('../utils/email');
const { reserveStock, confirmStockDeduction, releaseReservedStock, restoreStock } = require('./stockController');
const { calculateShippingForCarrier } = require('./shippingController');

// @POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod, notes, shippingMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Validate stock availability first (check available stock, not total stock)
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }
      if (product.type === 'physical' && product.trackInventory !== false) {
        const reserved = product.reservedStock ?? 0;
        const available = product.stock - reserved;
        if (available < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${available}` });
        }
      }

      const price = product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.thumbnail,
        price,
        quantity: item.quantity,
        variant: item.variant || '',
        // Carry shipping data for cost calculation
        _weight: product.weight || 0,
        _shippingClass: product.shippingClass || 'standard',
        _shippingOverrides: product.shippingOverrides ? Object.fromEntries(product.shippingOverrides) : {},
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.startDate <= new Date() && (!coupon.endDate || coupon.endDate >= new Date())) {
        const hasProductRestriction = coupon.applicableProducts && coupon.applicableProducts.length > 0;
        const hasCategoryRestriction = coupon.applicableCategories && coupon.applicableCategories.length > 0;

        let applicableSubtotal = subtotal;

        if (hasProductRestriction || hasCategoryRestriction) {
          const allowedProductIds = (coupon.applicableProducts || []).map((id) => id.toString());
          const allowedCategoryIds = (coupon.applicableCategories || []).map((id) => id.toString());

          // Re-fetch products to get their category for restriction check
          const eligibleSubtotal = await (async () => {
            let sum = 0;
            for (const item of items) {
              const product = await Product.findById(item.productId).select('category');
              if (!product) continue;
              const productMatch = hasProductRestriction && allowedProductIds.includes(item.productId.toString());
              const categoryMatch = hasCategoryRestriction && product.category && allowedCategoryIds.includes(product.category.toString());
              if (productMatch || categoryMatch) {
                const orderItem = orderItems.find((oi) => oi.product.toString() === item.productId.toString());
                if (orderItem) sum += orderItem.price * item.quantity;
              }
            }
            return sum;
          })();

          if (eligibleSubtotal === 0) {
            // Coupon doesn't apply to any item in this order — skip discount
            applicableSubtotal = 0;
          } else {
            applicableSubtotal = eligibleSubtotal;
          }
        }

        if (applicableSubtotal > 0 && applicableSubtotal >= coupon.minOrderAmount) {
          if (coupon.type === 'percentage') {
            discount = (applicableSubtotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, coupon.maxDiscountAmount);
          } else {
            discount = Math.min(coupon.value, applicableSubtotal);
          }
          await Coupon.findByIdAndUpdate(coupon._id, {
            $inc: { usageCount: 1 },
            $push: { usedBy: req.user._id },
          });
        }
      }
    }

    // Calculate shipping cost from rates
    let shippingCost = 0;
    try {
      const shippingRates = await ShippingRate.find({ isActive: true });
      if (shippingRates.length === 0) {
        // Fallback if no rates configured
        shippingCost = subtotal > 100 ? 0 : 10;
      } else {
        // Build cart items for shipping calculation
        const cartItemsForShipping = orderItems.map((oi) => ({
          quantity: oi.quantity,
          weight: oi._weight || 0,
          shippingClass: oi._shippingClass || 'standard',
          shippingOverrides: oi._shippingOverrides || {},
        }));

        // Find the selected carrier rate
        const selectedCarrierId = shippingMethod || 'ups_expedited';
        const selectedRate = shippingRates.find((r) => r.carrierId === selectedCarrierId) || shippingRates[0];

        if (selectedRate) {
          const calculated = calculateShippingForCarrier(selectedRate, cartItemsForShipping);
          shippingCost = calculated ?? 0;
        }
      }
    } catch (shippingErr) {
      // Non-fatal: fall back to simple rule
      shippingCost = subtotal > 100 ? 0 : 10;
    }

    // Strip internal shipping fields before saving
    const cleanOrderItems = orderItems.map(({ _weight, _shippingClass, _shippingOverrides, ...rest }) => rest);

    const tax = 0; // Tax handled separately if needed
    const total = subtotal + shippingCost - discount;

    const order = await Order.create({
      user: req.user._id,
      items: cleanOrderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      couponCode: couponCode || '',
      paymentMethod: paymentMethod || '',
      shippingMethod: shippingMethod || 'ups_expedited',
      notes: notes || '',
      statusHistory: [{ status: 'pending', note: 'Order created' }],
    });

    // Reserve stock (not deduct) — stock is held until payment confirms
    let reservedCount = 0;
    try {
      for (const item of items) {
        await reserveStock(item.productId, item.quantity, order._id, req.user._id);
        reservedCount += 1;
      }
    } catch (err) {
      if (reservedCount > 0) {
        const soFar = orderItems.slice(0, reservedCount);
        await releaseReservedStock(order._id, soFar, req.user._id, 'Order creation failed - releasing reserved stock');
      }
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ success: false, message: err.message || 'Failed to reserve stock' });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { orderCount: 1 } });

    const populatedOrder = await Order.findById(order._id).populate('items.product', 'name thumbnail');

    try {
      await sendOrderConfirmationEmail(req.user, populatedOrder);
    } catch {}

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    next(error);
  }
};

// @GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product', 'name thumbnail slug');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product', 'name thumbnail slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @POST /api/orders/validate-coupon
const validateCoupon = async (req, res, next) => {
  try {
    // cartItems: [{ productId, categoryId, price, quantity }]
    const { code, subtotal, cartItems = [] } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.endDate && coupon.endDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (coupon.userUsageLimit > 0 && req.user) {
      const timesUsed = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
      if (timesUsed >= coupon.userUsageLimit) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon' });
      }
    }

    // Check product / category restrictions
    const hasProductRestriction = coupon.applicableProducts && coupon.applicableProducts.length > 0;
    const hasCategoryRestriction = coupon.applicableCategories && coupon.applicableCategories.length > 0;

    if ((hasProductRestriction || hasCategoryRestriction) && cartItems.length > 0) {
      const allowedProductIds = (coupon.applicableProducts || []).map((id) => id.toString());
      const allowedCategoryIds = (coupon.applicableCategories || []).map((id) => id.toString());

      // Find which cart items qualify
      const eligibleItems = cartItems.filter((item) => {
        const productMatch = hasProductRestriction && allowedProductIds.includes(String(item.productId));
        const categoryMatch = hasCategoryRestriction && allowedCategoryIds.includes(String(item.categoryId));
        return productMatch || categoryMatch;
      });

      if (eligibleItems.length === 0) {
        const restriction = hasProductRestriction ? 'specific products' : 'specific categories';
        return res.status(400).json({
          success: false,
          message: `This coupon only applies to ${restriction} not in your cart`,
        });
      }

      // Recalculate subtotal using only eligible items
      const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (eligibleSubtotal < coupon.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum eligible order amount is ${coupon.minOrderAmount}` });
      }

      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = (eligibleSubtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, coupon.maxDiscountAmount);
      } else {
        discount = Math.min(coupon.value, eligibleSubtotal);
      }

      return res.json({ success: true, data: { coupon, discount, eligibleSubtotal } });
    }

    // No restriction — apply to full subtotal
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else {
      discount = coupon.value;
    }

    res.json({ success: true, data: { coupon, discount } });
  } catch (error) {
    next(error);
  }
};

// ---- ADMIN ----

// @GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name thumbnail');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingNumber } = req.body;
    const currentOrder = await Order.findById(req.params.id);
    if (!currentOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = currentOrder.status;
    const updates = { status };
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (status === 'delivered') updates.deliveredAt = new Date();
    if (status === 'cancelled') updates.cancelledAt = new Date();

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...updates,
        $push: { statusHistory: { status, note: note || '', timestamp: new Date() } },
      },
      { new: true }
    ).populate('user', 'name email');

    // Stock management based on status transitions
    try {
      if (status === 'confirmed' && previousStatus === 'pending') {
        // Payment confirmed: convert reservation to actual deduction
        await confirmStockDeduction(order._id, order.items, req.user._id);
      } else if (status === 'cancelled' && ['pending'].includes(previousStatus)) {
        // Cancelled before payment: release reserved stock
        await releaseReservedStock(order._id, order.items, req.user._id, note);
      } else if (status === 'cancelled' && ['confirmed', 'processing'].includes(previousStatus)) {
        // Cancelled after payment: restore deducted stock
        await restoreStock(order._id, order.items, req.user._id);
      } else if (status === 'refunded') {
        // Refund: restore stock
        await restoreStock(order._id, order.items, req.user._id);
      }
    } catch {}

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers,
      newUsersThisMonth,
      totalOrders,
      ordersThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      ordersByStatus,
      recentOrders,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find({ paymentStatus: 'paid' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email'),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
    const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersThisMonth,
          totalOrders,
          ordersThisMonth,
          revenueThisMonth: thisMonthRevenue,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        },
        ordersByStatus,
        recentOrders,
        topProducts,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/coupons
const getCoupons = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// @POST /api/admin/coupons
const createCoupon = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/coupons/:id
const updateCoupon = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  validateCoupon,
  getAllOrders,
  updateOrderStatus,
  getAnalytics,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
