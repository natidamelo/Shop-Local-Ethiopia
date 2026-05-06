# Payment Gateway Setup Guide

This guide explains how to connect payment gateways (Stripe, PayPal, Flutterwave, and Chapa) to your ShopL application and resolve common errors.

## Understanding the Errors

### 500 Internal Server Error
This error typically occurs when:
- Payment gateway API keys are missing or invalid
- Environment variables are not properly configured
- Database connection issues
- Payment gateway API is unreachable

### 404 Not Found Error
This error typically occurs when:
- API endpoint path is incorrect
- Route is not registered in the server
- Frontend is calling wrong API URL

## Payment Gateway Setup

### 1. Stripe (Credit/Debit Cards)

**Setup Steps:**
1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Go to Dashboard > Developers > API Keys
3. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for production)
4. Copy your **Publishable Key** (starts with `pk_test_` for test mode or `pk_live_` for production)

**Backend Configuration** (`backend/.env`):
```env
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend Configuration** (`frontend/.env.local`):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key_here
```

**Webhook Setup:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

### 2. PayPal

**Setup Steps:**
1. Create a PayPal Developer account at [https://developer.paypal.com](https://developer.paypal.com)
2. Go to Dashboard > My Apps & Credentials
3. Create a new app (Sandbox for testing, Live for production)
4. Copy **Client ID** and **Secret**

**Backend Configuration** (`backend/.env`):
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
```

**Frontend Configuration** (`frontend/.env.local`):
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

**Test Accounts:**
- Use PayPal Sandbox test accounts for testing
- Create test accounts in PayPal Developer Dashboard

---

### 3. Flutterwave (African Payment Gateway)

**Setup Steps:**
1. Create a Flutterwave account at [https://flutterwave.com](https://flutterwave.com)
2. Go to Settings > API Keys
3. Copy your **Secret Key** (starts with `FLWSECK_TEST_` for test or `FLWSECK_` for live)
4. Copy your **Public Key** (starts with `FLWPUBK_TEST_` for test or `FLWPUBK_` for live)

**Backend Configuration** (`backend/.env`):
```env
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_your_actual_secret_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_your_actual_public_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
```

**Frontend Configuration** (`frontend/.env.local`):
```env
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_your_actual_public_key
```

**Webhook Setup:**
1. Go to Flutterwave Dashboard > Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/flutterwave`
3. Select events: `charge.completed`, `charge.failed`

**Supported Payment Methods:**
- Credit/Debit Cards
- Mobile Money (MTN, Airtel, etc.)
- Bank Transfer
- USSD

---

### 4. Chapa (Ethiopian Banks & Mobile Money)

**Setup Steps:**
1. Create a Chapa account at [https://chapa.co](https://chapa.co)
2. Go to Dashboard > Settings > API Keys
3. Copy your **Secret Key** (starts with `CHASECK_TEST_` for test or `CHASECK_` for live)
4. Copy your **Public Key** (starts with `CHAPUBK_TEST_` for test or `CHAPUBK_` for live)

**Backend Configuration** (`backend/.env`):
```env
CHAPA_SECRET_KEY=CHASECK_TEST_your_actual_secret_key
CHAPA_PUBLIC_KEY=CHAPUBK_TEST_your_actual_public_key
```

**Frontend Configuration** (`frontend/.env.local`):
```env
NEXT_PUBLIC_CHAPA_PUBLIC_KEY=CHAPUBK_TEST_your_actual_public_key
```

**Webhook Setup:**
1. Go to Chapa Dashboard > Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/chapa`

**Supported Payment Methods:**
- Telebirr (Mobile Money)
- CBE Birr
- Awash Bank
- Dashen Bank
- Abyssinia Bank
- And more Ethiopian banks

---

## Environment Variables Checklist

### Backend (`backend/.env`)
- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `PAYPAL_CLIENT_ID` - PayPal client ID
- [ ] `PAYPAL_CLIENT_SECRET` - PayPal client secret
- [ ] `PAYPAL_MODE` - `sandbox` or `live`
- [ ] `FLUTTERWAVE_SECRET_KEY` - Flutterwave secret key
- [ ] `CHAPA_SECRET_KEY` - Chapa secret key
- [ ] `CLIENT_URL` - Your frontend URL (e.g., `http://localhost:3000`)

### Frontend (`frontend/.env.local`)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `http://localhost:8000/api`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - PayPal client ID
- [ ] `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` - Flutterwave public key
- [ ] `NEXT_PUBLIC_CHAPA_PUBLIC_KEY` - Chapa public key

---

## Troubleshooting Common Errors

### Error: "Stripe is not configured"
**Solution:** 
1. Check that `STRIPE_SECRET_KEY` is set in `backend/.env`
2. Ensure the key doesn't contain placeholder text like `your_stripe`
3. Restart your backend server after updating `.env`

### Error: "Order not found" (404)
**Solution:**
1. Ensure the order was created successfully before payment
2. Check that the user is authenticated
3. Verify the order belongs to the authenticated user

### Error: "Payment failed" (500)
**Solution:**
1. Check backend server logs for detailed error messages
2. Verify payment gateway API keys are correct
3. Ensure your backend server can reach payment gateway APIs
4. Check network connectivity and firewall settings

### Error: "Failed to load resource: 404"
**Solution:**
1. Verify the API endpoint exists in `backend/src/routes/paymentRoutes.js`
2. Check that the route is registered in `backend/server.js`
3. Ensure `NEXT_PUBLIC_API_URL` in frontend matches your backend URL
4. Check browser console for the exact failing URL

### Error: "Failed to load resource: 500"
**Solution:**
1. Check backend server logs for detailed error
2. Verify all required environment variables are set
3. Check database connection
4. Ensure payment gateway credentials are valid

---

## Testing Payment Gateways

### Testing Stripe
1. Use test card: `4242 4242 4242 4242`
2. Use any future expiry date (e.g., `12/34`)
3. Use any 3-digit CVC (e.g., `123`)
4. Use any ZIP code

### Testing PayPal
1. Use PayPal Sandbox test accounts
2. Create test accounts in PayPal Developer Dashboard
3. Use test credentials provided by PayPal

### Testing Flutterwave
1. Use Flutterwave test mode
2. Use test card numbers provided in Flutterwave dashboard
3. Test with various payment methods

### Testing Chapa
1. Use Chapa test mode
2. Use test credentials provided by Chapa
3. Test with Ethiopian bank accounts or Telebirr

---

## Production Deployment

### Before Going Live:
1. **Switch to Live Mode:**
   - Update all API keys to production keys
   - Change `PAYPAL_MODE` to `live`
   - Update webhook URLs to production domain

2. **Security:**
   - Never commit `.env` files to version control
   - Use environment variables in your hosting platform
   - Enable HTTPS for all payment endpoints
   - Verify webhook signatures

3. **Testing:**
   - Test all payment methods thoroughly
   - Verify webhook endpoints are working
   - Test error scenarios
   - Test refunds and cancellations

---

## API Endpoints Reference

### Payment Endpoints
- `POST /api/payments/stripe/create-intent` - Create Stripe payment intent
- `POST /api/payments/paypal/create-order` - Create PayPal order
- `POST /api/payments/paypal/capture` - Capture PayPal payment
- `POST /api/payments/flutterwave/initiate` - Initiate Flutterwave payment
- `POST /api/payments/chapa/initiate` - Initiate Chapa payment
- `GET /api/payments/chapa/verify/:txRef` - Verify Chapa transaction
- `GET /api/payments/my-payments` - Get user's payment history

### Webhook Endpoints
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/flutterwave` - Flutterwave webhook handler
- `POST /api/webhooks/chapa` - Chapa webhook handler

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test payment gateway APIs directly using their documentation
4. Check network connectivity and firewall settings
5. Review payment gateway dashboard for transaction logs

For payment gateway specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer Documentation](https://developer.paypal.com/docs)
- [Flutterwave Documentation](https://developer.flutterwave.com/docs)
- [Chapa Documentation](https://developer.chapa.co/docs)
