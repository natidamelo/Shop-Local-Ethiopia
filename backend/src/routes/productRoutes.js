const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
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
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:slug', getProductBySlug);
router.post('/:id/reviews', protect, addReview);

router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

module.exports = router;
