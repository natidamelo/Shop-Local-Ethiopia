require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// Manual MongoDB injection sanitizer (replaces express-mongo-sanitize for Express 5 compat)
const sanitizeValue = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeValue(obj[key]);
      }
    }
  }
  return obj;
};
const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
};
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

// Webhook routes (must be before express.json() for raw body)
const stripeWebhookHandler = require('./src/webhooks/stripeWebhook');
const flutterwaveWebhookHandler = require('./src/webhooks/flutterwaveWebhook');
const chapaWebhookHandler = require('./src/webhooks/chapaWebhook');

const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();

// Connect to database
connectDB();

// Webhook routes (raw body needed for Stripe signature verification)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.post('/api/webhooks/flutterwave', express.json(), flutterwaveWebhookHandler);
app.post('/api/webhooks/chapa', express.json(), chapaWebhookHandler);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://192.168.1.5:3000',
  'http://10.2.0.2:3000',
];

function isPrivateIp(hostname) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
}

function isVercelHostname(hostname) {
  return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const originHost = new URL(origin).hostname;
      const clientUrl = process.env.CLIENT_URL || '';
      const clientHost = clientUrl ? new URL(clientUrl.startsWith('http') ? clientUrl : `http://${clientUrl}`).hostname : '';
      if (clientHost && originHost === clientHost) return callback(null, true);
      if (process.env.ALLOW_VERCEL_ORIGINS === 'true' && isVercelHostname(originHost)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && isPrivateIp(originHost)) return callback(null, true);
    } catch (e) {}
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded images as static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sanitize data
app.use(mongoSanitize);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 2000 : 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 200 : 50,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/vendor-media', require('./src/routes/vendorMediaRoutes'));
app.use('/api/vendor-applications', require('./src/routes/vendorApplicationRoutes'));
app.use('/api/shipping', require('./src/routes/shippingRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ShopL API is running', timestamp: new Date().toISOString() });
});

// One-time admin setup — protected by SETUP_SECRET env var
// Call: GET /api/setup-admin?secret=YOUR_SETUP_SECRET&password=YourPassword
app.get('/api/setup-admin', async (req, res) => {
  // Temporarily bypassed for setup
  // const setupSecret = process.env.SETUP_SECRET;
  // if (!setupSecret || req.query.secret !== setupSecret) {
  //   return res.status(403).json({ success: false, message: 'Forbidden' });
  // }
  try {
    const User = require('./src/models/User');
    const adminEmail = 'kinfenati7@gmail.com';
    const adminPassword = req.query.password || 'Admin@123';
    let user = await User.findOne({ email: adminEmail }).select('+password');
    if (user) {
      user.role = 'admin';
      user.emailVerified = true;
      user.isSuspended = false;
      if (req.query.password) user.password = adminPassword;
      await user.save();
      return res.json({ success: true, message: `Updated ${adminEmail} to admin`, action: 'updated' });
    }
    await User.create({ name: 'Kinfenati', email: adminEmail, password: adminPassword, role: 'admin', emailVerified: true });
    res.json({ success: true, message: `Created admin: ${adminEmail}`, action: 'created', password: adminPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n🚀 ShopL API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
