const User = require('../models/User');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');

// @GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    if (email !== undefined && email.trim() !== '') {
      const normalized = email.toLowerCase().trim();
      if (normalized !== req.user.email) {
        const existing = await User.findOne({ email: normalized, _id: { $ne: req.user._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'That email is already in use' });
        }
        updates.email = normalized;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/users/addresses
const addAddress = async (req, res, next) => {
  try {
    const { label, street, city, state, country, zipCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({ label, street, city, state, country, zipCode, isDefault });
    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/addresses/:id
const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/users/addresses/:id
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).populate('items.product', 'name thumbnail');

    const totalOrders = await Order.countDocuments({ user: req.user._id });
    const totalSpent = await Order.aggregate([
      { $match: { user: req.user._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      data: {
        recentOrders: orders,
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- ADMIN CONTROLLERS ----

// @GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'active') query.isSuspended = false;

    const skip = (page - 1) * limit;
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, isSuspended } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
