require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopl');
  console.log('Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});

  // Create admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@shopl.com',
    password: 'Admin@123',
    role: 'admin',
    emailVerified: true,
  });

  // Create test user
  const user = await User.create({
    name: 'Test User',
    email: 'user@shopl.com',
    password: 'User@123',
    role: 'user',
    emailVerified: true,
  });

  // Create categories
  const categories = await Category.insertMany([
    { name: 'Cultural Cloth', slug: 'cultural-cloth', description: 'Authentic Ethiopian traditional clothing — Habesha kemis, netela, tilf and more', sortOrder: 1 },
    { name: 'Handmade', slug: 'handmade', description: 'Handcrafted objects by local artisans — baskets, pottery, leather goods and more', sortOrder: 2 },
    { name: 'Jewelry', slug: 'jewelry', description: 'Traditional Ethiopian silver and gold jewelry', sortOrder: 3 },
    { name: 'Art & Decor', slug: 'art', description: 'Hand-painted art, wall decor, and cultural decorations', sortOrder: 4 },
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', sortOrder: 5 },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', sortOrder: 6 },
    { name: 'Books', slug: 'books', description: 'Books and educational materials', sortOrder: 7 },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home decor and garden supplies', sortOrder: 8 },
    { name: 'Sports', slug: 'sports', description: 'Sports and fitness equipment', sortOrder: 9 },
    { name: 'Digital Products', slug: 'digital-products', description: 'Software, courses, and digital downloads', sortOrder: 10 },
  ]);

  const [culturalCloth, handmade, jewelry, artDecor, electronics, clothing, books, homeGarden, sports, digital] = categories;

  // Create sample products
  await Product.insertMany([
    // Cultural Cloth
    {
      name: 'Habesha Kemis — White & Gold',
      slug: 'habesha-kemis-white-gold',
      description: 'Beautifully hand-woven traditional Ethiopian Habesha Kemis with intricate gold border embroidery. Perfect for weddings, holidays, and cultural celebrations.',
      shortDescription: 'Hand-woven traditional Ethiopian dress with gold embroidery',
      type: 'physical',
      price: 49.99,
      comparePrice: 79.99,
      currency: 'USD',
      category: culturalCloth._id,
      stock: 25,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=500',
      tags: ['habesha kemis', 'traditional', 'cultural', 'ethiopian dress', 'handmade'],
      isFeatured: true,
      rating: 4.9,
      reviewCount: 128,
    },
    {
      name: 'Hand-Woven Netela Shawl',
      slug: 'hand-woven-netela-shawl',
      description: 'Traditional Ethiopian netela shawl, hand-woven from pure cotton. Worn as a head covering or shawl for religious and cultural occasions.',
      shortDescription: 'Traditional hand-woven Ethiopian cotton shawl',
      type: 'physical',
      price: 21.99,
      category: culturalCloth._id,
      stock: 60,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      tags: ['netela', 'shawl', 'traditional', 'cotton', 'handwoven'],
      rating: 4.8,
      reviewCount: 94,
    },
    {
      name: 'Tilf (Traditional Dress) — Premium',
      slug: 'tilf-traditional-dress-premium',
      description: 'Premium Tilf traditional Ethiopian dress with elaborate hand-embroidered patterns. Made from high-quality cotton fabric by skilled artisans.',
      shortDescription: 'Premium hand-embroidered traditional Ethiopian Tilf dress',
      type: 'physical',
      price: 97.99,
      comparePrice: 149.99,
      category: culturalCloth._id,
      stock: 15,
      images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500',
      tags: ['tilf', 'traditional dress', 'premium', 'embroidered', 'ethiopian'],
      isFeatured: true,
      rating: 4.9,
      reviewCount: 61,
    },
    // Handmade
    {
      name: 'Injera Basket (Mesob)',
      slug: 'injera-basket-mesob',
      description: 'Authentic hand-woven Ethiopian Mesob basket used for serving injera and traditional food. Made from natural grass and colorful thread by local artisans.',
      shortDescription: 'Authentic hand-woven Ethiopian Mesob serving basket',
      type: 'physical',
      price: 16.99,
      category: handmade._id,
      stock: 80,
      images: ['https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=500',
      tags: ['mesob', 'basket', 'handmade', 'traditional', 'woven'],
      isFeatured: true,
      rating: 4.7,
      reviewCount: 203,
    },
    {
      name: 'Ethiopian Coffee Ceremony Set',
      slug: 'ethiopian-coffee-ceremony-set',
      description: 'Complete traditional Ethiopian coffee ceremony set including jebena (clay pot), cups, and incense burner. Handcrafted by local artisans in Addis Ababa.',
      shortDescription: 'Complete traditional Ethiopian coffee ceremony set',
      type: 'physical',
      price: 74.99,
      comparePrice: 99.99,
      category: handmade._id,
      stock: 20,
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      tags: ['coffee', 'jebena', 'ceremony', 'handmade', 'clay'],
      isFeatured: true,
      rating: 4.9,
      reviewCount: 312,
    },
    {
      name: 'Leather Wallet — Handcrafted',
      slug: 'leather-wallet-handcrafted',
      description: 'Genuine leather wallet handcrafted by Ethiopian artisans. Features multiple card slots, a bill compartment, and traditional tooled designs.',
      shortDescription: 'Genuine leather handcrafted wallet with traditional designs',
      type: 'physical',
      price: 31.99,
      comparePrice: 49.99,
      category: handmade._id,
      stock: 45,
      images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
      tags: ['leather', 'wallet', 'handcrafted', 'artisan'],
      rating: 4.6,
      reviewCount: 88,
    },
    // Jewelry
    {
      name: 'Traditional Silver Necklace',
      slug: 'traditional-silver-necklace',
      description: 'Handcrafted traditional Ethiopian silver necklace with intricate filigree work. A timeless piece of cultural jewelry passed down through generations.',
      shortDescription: 'Handcrafted traditional Ethiopian silver filigree necklace',
      type: 'physical',
      price: 62.99,
      comparePrice: 89.99,
      category: jewelry._id,
      stock: 18,
      images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
      tags: ['silver', 'necklace', 'traditional', 'jewelry', 'handcrafted'],
      isFeatured: true,
      rating: 5.0,
      reviewCount: 47,
    },
    // Art & Decor
    {
      name: 'Hand-Painted Ethiopian Wall Art',
      slug: 'hand-painted-ethiopian-wall-art',
      description: 'Original hand-painted Ethiopian wall art depicting traditional scenes and cultural motifs. Each piece is unique and signed by the artist.',
      shortDescription: 'Original hand-painted Ethiopian cultural wall art',
      type: 'physical',
      price: 38.99,
      category: artDecor._id,
      stock: 12,
      images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500',
      tags: ['art', 'painting', 'wall art', 'ethiopian', 'handmade'],
      rating: 4.8,
      reviewCount: 35,
    },
    // Electronics
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
      shortDescription: 'Premium noise-cancelling wireless headphones',
      type: 'physical',
      price: 79.99,
      comparePrice: 129.99,
      category: electronics._id,
      stock: 50,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      tags: ['headphones', 'wireless', 'bluetooth', 'audio'],
      isFeatured: true,
      rating: 4.5,
      reviewCount: 128,
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.',
      shortDescription: 'Advanced health & fitness smartwatch',
      type: 'physical',
      price: 199.99,
      comparePrice: 299.99,
      category: electronics._id,
      stock: 30,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      tags: ['smartwatch', 'fitness', 'health'],
      isFeatured: true,
      rating: 4.7,
      reviewCount: 89,
    },
    {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'High-quality 100% organic cotton t-shirt, available in multiple colors.',
      shortDescription: 'Organic cotton premium t-shirt',
      type: 'physical',
      price: 29.99,
      category: clothing._id,
      stock: 200,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      tags: ['t-shirt', 'cotton', 'casual'],
      rating: 4.3,
      reviewCount: 245,
    },
    {
      name: 'JavaScript: The Complete Guide',
      slug: 'javascript-complete-guide',
      description: 'Comprehensive guide to modern JavaScript from basics to advanced concepts.',
      shortDescription: 'Complete JavaScript programming guide',
      type: 'physical',
      price: 39.99,
      category: books._id,
      stock: 100,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      tags: ['javascript', 'programming', 'web development'],
      rating: 4.8,
      reviewCount: 312,
    },
    {
      name: 'Web Development Masterclass',
      slug: 'web-development-masterclass',
      description: 'Complete online course covering HTML, CSS, JavaScript, React, and Node.js.',
      shortDescription: 'Full-stack web development online course',
      type: 'digital',
      price: 49.99,
      comparePrice: 199.99,
      category: digital._id,
      stock: 9999,
      images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
      tags: ['course', 'web development', 'programming'],
      isFeatured: true,
      rating: 4.9,
      reviewCount: 1024,
    },
    {
      name: 'Yoga Mat Premium',
      slug: 'yoga-mat-premium',
      description: 'Non-slip, eco-friendly yoga mat with alignment lines. Perfect for all yoga styles.',
      shortDescription: 'Eco-friendly non-slip yoga mat',
      type: 'physical',
      price: 45.99,
      category: sports._id,
      stock: 75,
      images: ['https://images.unsplash.com/photo-1601925228008-4c0f9b8b3e8a?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1601925228008-4c0f9b8b3e8a?w=500',
      tags: ['yoga', 'fitness', 'mat'],
      rating: 4.6,
      reviewCount: 167,
    },
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('👤 Admin: admin@shopl.com / Admin@123');
  console.log('👤 User: user@shopl.com / User@123');

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
