const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { generateSlug } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary');

// @GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      type,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      featured,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      // If category is a slug (string), find the category by slug first
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category, isActive: true });
        if (cat) {
          query.category = cat._id;
        } else {
          // If category slug not found, return empty results
          return res.json({
            success: true,
            data: [],
            pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 },
          });
        }
      }
    }
    if (type) query.type = type;
    if (featured === 'true') query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/products/:slugOrId
const getProductBySlug = async (req, res, next) => {
  try {
    const param = req.params.slug;
    let product;
    if (mongoose.Types.ObjectId.isValid(param)) {
      product = await Product.findById(param).populate('category', 'name slug');
    }
    if (!product) {
      product = await Product.findOne({ slug: param, isActive: true }).populate('category', 'name slug');
    }
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: { product, reviews } });
  } catch (error) {
    next(error);
  }
};

// @POST /api/products (admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    const slug = generateSlug(name);

    const existing = await Product.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const product = await Product.create({ name, slug: finalSlug, ...rest });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/products/:id (admin)
const updateProduct = async (req, res, next) => {
  try {
    if (req.body.name) {
      req.body.slug = generateSlug(req.body.name);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/products/:id (admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/products/:id/reviews
const addReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const existing = await Review.findOne({ product: product._id, user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating,
      title,
      comment,
    });

    const reviews = await Review.find({ product: product._id, isApproved: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(product._id, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @POST /api/categories (admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    const slug = generateSlug(name);
    const category = await Category.create({ name, slug, ...rest });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/categories/:id (admin)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/categories/:id (admin)
const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
