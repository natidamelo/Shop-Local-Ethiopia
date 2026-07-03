const mongoose = require('mongoose');

const heroButtonSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    link: { type: String, default: '' },
    style: { type: String, enum: ['primary', 'outline'], default: 'primary' },
  },
  { _id: false }
);

const heroStatSchema = new mongoose.Schema(
  {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  { _id: false }
);

const whyChooseFeatureSchema = new mongoose.Schema(
  { title: { type: String, default: '' }, desc: { type: String, default: '' } },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    text: { type: String, required: true, trim: true },
    avatar: { type: String, default: '', trim: true }, // optional; if empty, use first letter of name
    rating: { type: Number, default: 5, min: 1, max: 5 },
  },
  { _id: false }
);

const navLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Shop Local Ethiopia' },
    logoUrl: { type: String, default: '' },
    tagline: { type: String, default: '' },
    navLinks: {
      type: [navLinkSchema],
      default: [
        { href: '/shop', label: 'Shop' },
        { href: '/shop/hand-woven-textiles-and-apparel', label: 'Textiles & Apparel' },
        { href: '/shop/artisan-craft-and-home-decor', label: 'Artisan & Decor' },
        { href: '/shop?featured=true', label: 'Featured' },
        { href: '/bazar-vendor-apply', label: 'Join Bazar as Vendor' },
      ],
    },

    // Footer contact (shown on every page)
    contactEmail: { type: String, default: 'support@shopLocal.com' },
    contactPhone: { type: String, default: '+251 911 959219' },
    contactAddress: { type: String, default: 'Addis Ababa, Ethiopia' },

    // "Why Choose" section on homepage (heading, subtitle, 6 feature cards)
    whyChooseHeading: { type: String, default: 'Why Choose' },
    whyChooseSubtitle: { type: String, default: 'The best shopping experience for Ethiopian cultural products.' },
    whyChooseFeatures: {
      type: [whyChooseFeatureSchema],
      default: [
        { title: 'Secure Payments', desc: 'Stripe, PayPal, Flutterwave, Telebirr & CBE Birr supported.' },
        { title: 'Fast Delivery', desc: 'Same-day in Addis Ababa, nationwide within 3–10 days.' },
        { title: 'Easy Returns', desc: '30-day hassle-free returns on all physical products.' },
        { title: '24/7 Support', desc: 'Round-the-clock support via chat, email, and phone.' },
        { title: 'Global Reach', desc: 'Multi-currency shopping from anywhere in the world.' },
        { title: 'Instant Digital', desc: 'Instant delivery for courses, downloads & software.' },
      ],
    },

    trustBadges: {
      type: [String],
      default: ['Free shipping over ETB 1000', 'Secure checkout', '30-day returns'],
    },

    testimonials: {
      type: [testimonialSchema],
      default: [
        { name: 'Abebe Girma', role: 'Business Owner', text: 'ShopL has the most beautiful Ethiopian cultural clothing I\'ve ever seen online. Outstanding quality!', avatar: 'A', rating: 5 },
        { name: 'Sara Tadesse', role: 'Fashion Designer', text: 'Amazing handcrafted jewelry and habesha kemis. Telebirr & CBE payment makes it so convenient!', avatar: 'S', rating: 5 },
        { name: 'Michael Johnson', role: 'Cultural Enthusiast', text: 'Best place for authentic Ethiopian handmade objects. Fast shipping and excellent service.', avatar: 'M', rating: 5 },
        { name: 'Fatima Ahmed', role: 'Entrepreneur', text: 'The variety of cultural products and payment options is unmatched. Highly recommend ShopL!', avatar: 'F', rating: 5 },
      ],
    },

    // Welcome / promo popup coupon
    welcomeCouponCode: { type: String, default: 'WELCOME10' },
    welcomeDiscount: { type: String, default: '10%' }, // display text e.g. "10%" or "ETB 500"

    // Bazar table pricing
    bazarTablePricing: {
      fullTablePrice: { type: Number, default: 0 },
      halfTablePrice: { type: Number, default: 0 },
      currency: { type: String, default: 'ETB' },
      priceNote: { type: String, default: '' },
    },

    // Bazar vendor registration window
    bazarRegistration: {
      isOpen: { type: Boolean, default: false },
      // Optional scheduled open/close window. When set, isOpen is auto-derived at read time.
      scheduledOpenAt: { type: Date, default: null },
      scheduledCloseAt: { type: Date, default: null },
      closedMessage: {
        type: String,
        default: 'Vendor registration is currently closed. Please check back later.',
      },
    },

    // Bazar rules shown on vendor application form (editable from admin)
    bazarRules: {
      type: [String],
      default: [
        'Arrive at least 30 minutes before the bazar opens to set up your table.',
        'Keep your table tidy and do not block aisles or other vendors.',
        'Prices must be clearly displayed for all products or services.',
        'No counterfeit, illegal, or inappropriate items are allowed.',
        'Follow all instructions from the organizing team during setup and closing.',
      ],
    },

    // Optional poster image shown on the public bazar vendor application page
    bazarPosterUrl: {
      type: String,
      default: '',
    },

    // Hero section
    hero: {
      badge1: { type: String, default: 'Made in Ethiopia · ሱቅ' },
      badge2: { type: String, default: '✦ Authentic Handmade' },
      headlineLine1: { type: String, default: 'Discover' },
      headlineLine2: { type: String, default: 'Culture,' },
      headlineLine3: { type: String, default: 'Wear Heritage' },
      description: {
        type: String,
        default:
          'Explore authentic Ethiopian cultural clothing, handmade crafts, traditional jewelry, and artisan objects. Pay with Telebirr, CBE Birr, Stripe, or PayPal.',
      },
      buttons: {
        type: [heroButtonSchema],
        default: [
          { text: 'Shop Now', link: '/shop', style: 'primary' },
          { text: 'Get Started', link: '/register', style: 'outline' },
        ],
      },
      socialProofText: { type: String, default: '50,000+ happy customers' },
      heroImageUrl: { type: String, default: '' },
      heroMediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      heroVideoUrl: { type: String, default: '' },
      heroVideoAutoplay: { type: Boolean, default: true },
      heroVideoLoop: { type: Boolean, default: true },
      heroVideoMuted: { type: Boolean, default: true },
      showProductCards: { type: Boolean, default: true },
      stats: {
        type: [heroStatSchema],
        default: [
          { value: '50K+', label: 'Happy Customers' },
          { value: '5K+', label: 'Handmade Items' },
          { value: '200+', label: 'Local Artisans' },
          { value: '4.9', label: 'Average Rating' },
        ],
      },
      ctaBannerTitle: { type: String, default: 'Ready to Explore\nEthiopian Culture?' },
      ctaBannerDescription: {
        type: String,
        default:
          'Join 50,000+ customers and discover authentic handmade cultural products from Ethiopia.',
      },
    },
    // Support pages — each page has a list of sections (title + content)
    supportPages: {
      helpCenter: { type: mongoose.Schema.Types.Mixed, default: null },
      returns: { type: mongoose.Schema.Types.Mixed, default: null },
      shippingInfo: { type: mongoose.Schema.Types.Mixed, default: null },
      privacy: { type: mongoose.Schema.Types.Mixed, default: null },
      terms: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true }
);

// Single document: use a fixed id so we always have one settings doc
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ siteName: 'ShopL' });
  }
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
