/**
 * Seed script: categories and products for the shop.
 * Uses MONGODB_URI from .env (shopl database).
 * Run from backend: node src/utils/seed-categories-products.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopl';

const connectDB = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const seed = async () => {
  await connectDB();

  await Category.deleteMany({});
  await Product.deleteMany({});

  const categoryData = [
    { name: 'Specialty single-origin coffee', slug: 'specialty-single-origin-coffee', description: 'Single-origin Ethiopian coffee', sortOrder: 1 },
    { name: 'Herbal tea', slug: 'herbal-tea', description: 'Herbal teas', sortOrder: 2 },
    { name: 'Coffee ceremony kits', slug: 'coffee-ceremony-kits', description: 'Coffee ceremony kits', sortOrder: 3 },
    { name: 'Ethiopian honey', slug: 'ethiopian-honey', description: 'Ethiopian honey', sortOrder: 4 },
    { name: 'Essential oils', slug: 'essential-oils', description: 'Essential oils', sortOrder: 5 },
    { name: 'Ancient Grains', slug: 'ancient-grains', description: 'Ancient grains', sortOrder: 6 },
    { name: 'Spices and Berbere', slug: 'spices-and-berbere', description: 'Spices and Berbere', sortOrder: 7 },
    { name: 'Hand-woven Textiles and Apparel', slug: 'hand-woven-textiles-and-apparel', description: 'Hand-woven textiles and apparel', sortOrder: 8 },
    { name: 'Leather and leather Goods', slug: 'leather-and-leather-goods', description: 'Leather and leather goods', sortOrder: 9 },
    { name: 'Artisan craft and home décor', slug: 'artisan-craft-and-home-decor', description: 'Artisan craft and home décor', sortOrder: 10 },
    { name: 'Natural body and hair care', slug: 'natural-body-and-hair-care', description: 'Natural body and hair care', sortOrder: 11 },
    { name: "Kids' corner", slug: 'kids-corner', description: "Kids' corner", sortOrder: 12 },
  ];

  const categories = await Category.insertMany(categoryData);
  const [
    specialtyCoffee,
    herbalTea,
    coffeeCeremonyKits,
    ethiopianHoney,
    essentialOils,
    ancientGrains,
    spicesBerbere,
    handWovenTextiles,
    leatherGoods,
    artisanCraft,
    bodyHairCare,
    kidsCorner,
  ] = categories;

  // Real image URLs (Unsplash) per product — stored in DB
  const productEntries = [
    { name: 'Specialty single-origin coffee', slug: 'specialty-single-origin-coffee', category: specialtyCoffee, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80' },
    { name: 'Herbal tea', slug: 'herbal-tea', category: herbalTea, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80' },
    { name: 'Coffee ceremony kits', slug: 'coffee-ceremony-kits', category: coffeeCeremonyKits, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80' },
    { name: 'Ethiopian honey', slug: 'ethiopian-honey', category: ethiopianHoney, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80' },
    { name: 'Essential oils', slug: 'essential-oils', category: essentialOils, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80' },
    { name: 'Ancient Grains', slug: 'ancient-grains', category: ancientGrains, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80' },
    { name: 'Spices and Berbere', slug: 'spices-and-berbere', category: spicesBerbere, image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80' },
    { name: 'Habesha Kemis', slug: 'habesha-kemis', category: handWovenTextiles, image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80' },
    { name: 'Scarves and Wraps', slug: 'scarves-and-wraps', category: handWovenTextiles, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { name: 'Netela', slug: 'netela', category: handWovenTextiles, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80' },
    { name: "Men's wear", slug: 'mens-wear', category: handWovenTextiles, image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80' },
    { name: 'Hand woven cotton', slug: 'hand-woven-cotton', category: handWovenTextiles, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80' },
    { name: 'Hand bags and purses', slug: 'hand-bags-and-purses', category: leatherGoods, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
    { name: 'Journal cover and wallet', slug: 'journal-cover-and-wallet', category: leatherGoods, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80' },
    { name: 'Belts and sandals', slug: 'belts-and-sandals', category: leatherGoods, image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80' },
    { name: 'Travel bags', slug: 'travel-bags', category: leatherGoods, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
    { name: 'Tote bags', slug: 'tote-bags', category: leatherGoods, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' },
    { name: 'Handmade leather bags', slug: 'handmade-leather-bags', category: leatherGoods, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
    { name: 'Ethiopian crosses', slug: 'ethiopian-crosses', category: artisanCraft, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80' },
    { name: 'Traditional baskets', slug: 'traditional-baskets', category: artisanCraft, image: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=800&q=80' },
    { name: 'Traditional curtain', slug: 'traditional-curtain', category: artisanCraft, image: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800&q=80' },
    { name: 'Duvet cover', slug: 'duvet-cover', category: artisanCraft, image: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=800&q=80' },
    { name: 'Pillow case', slug: 'pillow-case', category: artisanCraft, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80' },
    { name: 'Rugs', slug: 'rugs', category: artisanCraft, image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80' },
    { name: 'Natural body and hair care', slug: 'natural-body-and-hair-care', category: bodyHairCare, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80' },
    { name: "Kids' corner", slug: 'kids-corner-product', category: kidsCorner, image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80' },
  ];

  const products = productEntries.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: `${p.name} — available in our shop.`,
    shortDescription: p.name,
    type: 'physical',
    price: 0,
    currency: 'ETB',
    category: p.category._id,
    stock: 0,
    tags: [p.name],
    images: [p.image],
    thumbnail: p.image,
  }));

  await Product.insertMany(products);

  console.log('✅ Categories and products seeded successfully.');
  console.log('   Categories:', categories.length);
  console.log('   Products:', products.length);

  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
