const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { sendLowStockAlert } = require('../utils/email');

const recordMovement = async ({ product, type, quantity, reason, reference, performedBy, variant }) => {
  const previousStock = product.stock;
  const newStock = previousStock + quantity;

  await StockMovement.create({
    product: product._id,
    type,
    quantity,
    previousStock,
    newStock,
    reason: reason || '',
    reference: reference || {},
    performedBy,
    variant: variant || '',
  });

  return newStock;
};

// Physical products that track inventory (include docs where trackInventory is missing for backwards compatibility)
const physicalInventoryQuery = {
  isActive: true,
  type: 'physical',
  $or: [{ trackInventory: true }, { trackInventory: { $exists: false } }],
};

// @GET /api/admin/inventory/summary
const getInventorySummary = async (req, res, next) => {
  try {
    const [totalProducts, outOfStock, lowStock, totalStockValue] = await Promise.all([
      Product.countDocuments(physicalInventoryQuery),
      Product.countDocuments({ ...physicalInventoryQuery, stock: 0 }),
      Product.aggregate([
        { $match: physicalInventoryQuery },
        { $match: { $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } } },
        { $count: 'count' },
      ]),
      Product.aggregate([
        { $match: physicalInventoryQuery },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } }, totalUnits: { $sum: '$stock' }, totalReserved: { $sum: '$reservedStock' } } },
      ]),
    ]);

    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('product', 'name thumbnail sku')
      .populate('performedBy', 'name');

    const movementStats = await StockMovement.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          outOfStock,
          lowStock: lowStock[0]?.count || 0,
          totalUnits: totalStockValue[0]?.totalUnits || 0,
          totalReserved: totalStockValue[0]?.totalReserved || 0,
          totalValue: Math.round((totalStockValue[0]?.totalValue || 0) * 100) / 100,
        },
        recentMovements,
        movementStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/inventory/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      ...physicalInventoryQuery,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name thumbnail sku stock reservedStock lowStockThreshold price category soldCount')
        .populate('category', 'name')
        .sort({ stock: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/inventory/:productId/adjust
const adjustStock = async (req, res, next) => {
  try {
    const { quantity, type, reason } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.type !== 'physical') {
      return res.status(400).json({ success: false, message: 'Stock management only applies to physical products' });
    }

    const adjustmentType = type || 'adjustment';
    const newStock = product.stock + quantity;

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: `Cannot reduce stock below 0. Current stock: ${product.stock}` });
    }

    await recordMovement({
      product,
      type: adjustmentType,
      quantity,
      reason,
      performedBy: req.user._id,
    });

    product.stock = newStock;
    await product.save();

    if (product.stock <= product.lowStockThreshold && product.stock > 0) {
      try { await sendLowStockAlert(product); } catch {}
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/inventory/:productId/set
const setStock = async (req, res, next) => {
  try {
    const { stock, reason } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    const diff = stock - product.stock;

    await recordMovement({
      product,
      type: 'correction',
      quantity: diff,
      reason: reason || 'Manual stock correction',
      performedBy: req.user._id,
    });

    product.stock = stock;
    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/inventory/bulk-adjust
const bulkAdjustStock = async (req, res, next) => {
  try {
    const { adjustments } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of adjustments' });
    }

    const results = [];
    const errors = [];

    for (const adj of adjustments) {
      try {
        const product = await Product.findById(adj.productId);
        if (!product) {
          errors.push({ productId: adj.productId, error: 'Product not found' });
          continue;
        }

        const newStock = adj.setTo !== undefined ? adj.setTo : product.stock + (adj.quantity || 0);
        if (newStock < 0) {
          errors.push({ productId: adj.productId, name: product.name, error: 'Would result in negative stock' });
          continue;
        }

        const diff = newStock - product.stock;
        await recordMovement({
          product,
          type: adj.setTo !== undefined ? 'correction' : 'adjustment',
          quantity: diff,
          reason: adj.reason || 'Bulk stock update',
          performedBy: req.user._id,
        });

        product.stock = newStock;
        await product.save();
        results.push({ productId: product._id, name: product.name, newStock });
      } catch (err) {
        errors.push({ productId: adj.productId, error: err.message });
      }
    }

    res.json({ success: true, data: { updated: results, errors } });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/inventory/:productId/history
const getStockHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      StockMovement.find({ product: req.params.productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('performedBy', 'name email'),
      StockMovement.countDocuments({ product: req.params.productId }),
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/inventory/movements
const getAllMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, type, productId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;
    if (productId) query.product = productId;

    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('product', 'name thumbnail sku')
        .populate('performedBy', 'name'),
      StockMovement.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/inventory/:productId/threshold
const updateThreshold = async (req, res, next) => {
  try {
    const { lowStockThreshold } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { lowStockThreshold },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Helper: reserve stock for an order (called from orderController)
const reserveStock = async (productId, quantity, orderId, userId) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  if (product.type === 'physical' && product.trackInventory !== false) {
    const reserved = product.reservedStock ?? 0;
    const available = product.stock - reserved;
    if (available < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${available}`);
    }

    await recordMovement({
      product,
      type: 'reservation',
      quantity: -quantity,
      reason: `Reserved for order`,
      reference: { model: 'Order', id: orderId },
      performedBy: userId,
    });

    product.reservedStock = (product.reservedStock ?? 0) + quantity;
    await product.save();
  }

  return product;
};

// Helper: confirm stock deduction (payment confirmed)
const confirmStockDeduction = async (orderId, items, userId) => {
  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);
    if (!product || product.type !== 'physical' || product.trackInventory === false) continue;

    const qty = item.quantity;

    await recordMovement({
      product,
      type: 'sale',
      quantity: -qty,
      reason: 'Payment confirmed - stock deducted',
      reference: { model: 'Order', id: orderId },
      performedBy: userId,
    });

    const newReserved = Math.max(0, (product.reservedStock ?? 0) - qty);
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: -qty, soldCount: qty },
      $set: { reservedStock: newReserved },
    });

    if (product.stock - qty <= product.lowStockThreshold && product.stock - qty > 0) {
      try { await sendLowStockAlert(product); } catch {}
    }
  }
};

// Helper: release reserved stock (order cancelled/failed)
const releaseReservedStock = async (orderId, items, userId, reason) => {
  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);
    if (!product || product.type !== 'physical' || product.trackInventory === false) continue;

    const qty = item.quantity;

    await recordMovement({
      product,
      type: 'release',
      quantity: qty,
      reason: reason || 'Order cancelled - stock released',
      reference: { model: 'Order', id: orderId },
      performedBy: userId,
    });

    product.reservedStock = Math.max(0, (product.reservedStock ?? 0) - qty);
    await product.save();
  }
};

// Helper: restore stock (refund after delivery)
const restoreStock = async (orderId, items, userId) => {
  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);
    if (!product || product.type !== 'physical' || product.trackInventory === false) continue;

    const qty = item.quantity;

    await recordMovement({
      product,
      type: 'return',
      quantity: qty,
      reason: 'Order refunded - stock restored',
      reference: { model: 'Order', id: orderId },
      performedBy: userId,
    });

    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: qty, soldCount: -qty },
    });
  }
};

module.exports = {
  getInventorySummary,
  getLowStockProducts,
  adjustStock,
  setStock,
  bulkAdjustStock,
  getStockHistory,
  getAllMovements,
  updateThreshold,
  reserveStock,
  confirmStockDeduction,
  releaseReservedStock,
  restoreStock,
};
