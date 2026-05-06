const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');

// @GET /api/admin/financial/overview
const getFinancialOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      todayRevenue,
      monthRevenue,
      lastMonthRevenue,
      yearRevenue,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      refundedAmount,
      totalRefunds,
      paymentMethodsBreakdown,
    ] = await Promise.all([
      // Total Revenue (all time)
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Today Revenue
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // This Month Revenue
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Last Month Revenue
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Year Revenue
      Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Total Transactions
      Payment.countDocuments(),
      // Completed Transactions
      Payment.countDocuments({ status: 'completed' }),
      // Pending Transactions
      Payment.countDocuments({ status: 'pending' }),
      // Failed Transactions
      Payment.countDocuments({ status: 'failed' }),
      // Refunded Amount
      Payment.aggregate([
        { $match: { status: 'refunded' } },
        { $group: { _id: null, total: { $sum: '$refundAmount' } } },
      ]),
      // Total Refunds Count
      Payment.countDocuments({ status: 'refunded' }),
      // Payment Methods Breakdown
      Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$gateway',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const thisMonthRev = monthRevenue[0]?.total || 0;
    const lastMonthRev = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: thisMonthRev,
        yearRevenue: yearRevenue[0]?.total || 0,
        revenueGrowth: revenueGrowth.toFixed(2),
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        refundedAmount: refundedAmount[0]?.total || 0,
        totalRefunds,
        paymentMethodsBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/financial/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, gateway, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (gateway) query.gateway = gateway;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate('order', 'orderNumber total')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/financial/revenue-chart
const getRevenueChart = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id:
            period === 'day'
              ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              : period === 'week'
              ? { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
              : period === 'month'
              ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
              : { $dateToString: { format: '%Y', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/admin/financial/refund/:paymentId
const processRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId).populate('order');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only refund completed payments' });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed payment amount' });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = reason || 'Admin refund';
    payment.refundedAt = new Date();
    await payment.save();

    // Update order status
    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order._id, {
        paymentStatus: 'refunded',
        status: 'refunded',
        $push: { statusHistory: { status: 'refunded', note: `Refunded: ${reason || 'Admin refund'}` } },
      });
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialOverview,
  getTransactions,
  getRevenueChart,
  processRefund,
};
