# ShopL - Full-Stack E-Commerce Platform

A modern, full-featured e-commerce platform built with Next.js 14, Node.js/Express, and MongoDB. Supports multiple payment gateways including Stripe, PayPal, Flutterwave, and Ethiopian payment methods (Telebirr, CBE Birr, Awash Bank, Dashen Bank) via Chapa.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Framer Motion |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| Auth | JWT (access + refresh tokens), bcrypt, TOTP MFA (speakeasy) |
| Payments | Stripe, PayPal, Flutterwave, Chapa (Telebirr, CBE, Awash, Dashen) |
| Email | Nodemailer (SMTP) |
| State | Zustand, TanStack React Query |
| Charts | Recharts |

---

## Project Structure

```
shop-l/
├── frontend/          # Next.js 14 App
│   ├── app/
│   │   ├── (auth)/    # Login, Register, Forgot/Reset Password
│   │   ├── admin/     # Admin Dashboard
│   │   ├── cart/      # Shopping Cart
│   │   ├── checkout/  # Multi-step Checkout
│   │   ├── dashboard/ # User Dashboard
│   │   └── shop/      # Product Listing & Detail
│   ├── components/
│   │   ├── layout/    # Navbar, Footer
│   │   ├── shop/      # ProductCard
│   │   └── ui/        # Shadcn components
│   └── lib/
│       ├── api.ts     # Axios client with interceptors
│       └── store/     # Zustand stores (auth, cart)
│
└── backend/           # Node.js Express API
    ├── src/
    │   ├── config/    # DB, Cloudinary config
    │   ├── controllers/
    │   ├── middleware/ # Auth, error handling, upload
    │   ├── models/    # Mongoose schemas
    │   ├── routes/    # API routes
    │   ├── utils/     # JWT, email, helpers, seed
    │   └── webhooks/  # Payment webhook handlers
    └── server.js
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

## Quick Start

### 1. Clone / Open the project

```bash
cd "c:\shop L"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (already created, update with your keys):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopl
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CLIENT_URL=http://localhost:3000

# Email (Mailtrap for dev)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
EMAIL_FROM=noreply@shopl.com
EMAIL_FROM_NAME=ShopL

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...

# Chapa (Ethiopian Payments)
CHAPA_SECRET_KEY=CHASECK_TEST-...
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-...

# Cloudinary (optional, for image uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Seed the database with sample data:

```bash
cd src/utils
node seed.js
```

Start the backend:

```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` (already created, update with your keys):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
NEXT_PUBLIC_CHAPA_PUBLIC_KEY=CHAPUBK_TEST-...
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## Demo Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopl.com | Admin@123 |
| User | user@shopl.com | User@123 |

---

## Features

### User Features
- Register, login with JWT authentication
- Two-factor authentication (TOTP via Google Authenticator)
- Password reset via email
- Profile management with addresses
- Browse products with filters, search, and sorting
- Product detail pages with reviews
- Shopping cart with coupon support
- Multi-step checkout
- Multiple payment methods: Stripe, PayPal, Flutterwave, Chapa (Telebirr, CBE, Awash, Dashen)
- Order history and tracking
- Payment history

### Admin Features
- Analytics dashboard with revenue charts
- User management (CRUD, suspend, role change)
- Product management (CRUD with categories)
- Order management with status updates
- Coupon management

### Technical Features
- Light/dark mode toggle
- Responsive design (mobile, tablet, desktop)
- JWT refresh token rotation
- Webhook handlers for all payment gateways
- Rate limiting and security headers
- Input sanitization and CSRF protection
- Automated email notifications

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/mfa/setup
POST /api/auth/mfa/verify
POST /api/auth/mfa/disable
```

### Users
```
GET  /api/users/profile
PUT  /api/users/profile
PUT  /api/users/password
GET  /api/users/dashboard-stats
POST /api/users/addresses
PUT  /api/users/addresses/:id
DEL  /api/users/addresses/:id
```

### Products
```
GET  /api/products
GET  /api/products/categories
GET  /api/products/:slug
POST /api/products/:id/reviews
POST /api/products          (admin)
PUT  /api/products/:id      (admin)
DEL  /api/products/:id      (admin)
```

### Orders
```
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
POST /api/orders/validate-coupon
```

### Payments
```
GET  /api/payments/my-payments
POST /api/payments/stripe/create-intent
POST /api/payments/paypal/create-order
POST /api/payments/paypal/capture
POST /api/payments/flutterwave/initiate
POST /api/payments/chapa/initiate
GET  /api/payments/chapa/verify/:txRef
```

### Admin
```
GET  /api/admin/analytics
GET  /api/admin/users
PUT  /api/admin/users/:id
DEL  /api/admin/users/:id
GET  /api/admin/orders
PUT  /api/admin/orders/:id/status
GET  /api/admin/coupons
POST /api/admin/coupons
PUT  /api/admin/coupons/:id
DEL  /api/admin/coupons/:id
```

### Webhooks
```
POST /api/webhooks/stripe
POST /api/webhooks/flutterwave
POST /api/webhooks/chapa
```

---

## Payment Gateway Setup

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API Keys
3. For webhooks: Dashboard > Developers > Webhooks > Add endpoint
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### PayPal
1. Create app at [developer.paypal.com](https://developer.paypal.com)
2. Get Client ID and Secret from sandbox app

### Flutterwave
1. Create account at [flutterwave.com](https://flutterwave.com)
2. Get keys from Dashboard > Settings > API Keys
3. Set webhook URL in Dashboard > Settings > Webhooks

### Chapa (Ethiopian Payments)
1. Create account at [chapa.co](https://chapa.co)
2. Get API keys from Dashboard > Settings > API Keys
3. Supports: Telebirr, CBE Birr, Awash Bank, Dashen Bank, Abyssinia Bank, and more

---

## Deployment

### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

### Railway/Render (Backend)
1. Connect your GitHub repository
2. Set environment variables from `.env`
3. Set build command: `npm install`
4. Set start command: `npm start`

### Docker (Optional)
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## Security

- JWT with short-lived access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (12 salt rounds)
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min general, 10 req/15min auth)
- MongoDB injection sanitization
- Webhook signature verification
- HTTPS enforced in production

---

## License

MIT License - feel free to use for personal and commercial projects.
