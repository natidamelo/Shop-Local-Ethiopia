# Troubleshooting Payment Errors

## Quick Fix Guide

### Error: "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"

**What it means:** The backend server encountered an error while processing the payment request.

**Common Causes & Solutions:**

1. **Missing Payment Gateway API Keys**
   - **Symptom:** Error occurs when trying to process payment
   - **Fix:** Add payment gateway API keys to `backend/.env`
   - **Example for Stripe:**
     ```env
     STRIPE_SECRET_KEY=sk_test_your_actual_key_here
     ```
   - **Check:** The error message will now tell you which gateway is missing

2. **Invalid API Keys**
   - **Symptom:** Payment fails even with keys set
   - **Fix:** Verify keys are correct in payment gateway dashboard
   - **Test:** Try creating a test payment in the gateway's dashboard

3. **Database Connection Issues**
   - **Symptom:** Order creation fails
   - **Fix:** Check MongoDB connection in `backend/.env`
     ```env
     MONGODB_URI=mongodb://127.0.0.1:27017/shopl
     ```
   - **Verify:** Ensure MongoDB is running

4. **Missing Environment Variables**
   - **Symptom:** Various errors
   - **Fix:** Ensure all required variables are in `backend/.env`
   - **Check:** See `PAYMENT_SETUP_GUIDE.md` for complete list

---

### Error: "Failed to load resource: the server responded with a status of 404 (Not Found)"

**What it means:** The API endpoint doesn't exist or the URL is incorrect.

**Common Causes & Solutions:**

1. **Wrong API Base URL**
   - **Symptom:** All API calls fail with 404
   - **Fix:** Check `frontend/.env.local`
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8000/api
     ```
   - **Note:** Port must match your backend server port (check `backend/.env` PORT)

2. **Backend Server Not Running**
   - **Symptom:** All API calls fail
   - **Fix:** Start backend server
     ```bash
     cd backend
     npm start
     ```
   - **Verify:** Check `http://localhost:8000/api/health` in browser

3. **Route Not Registered**
   - **Symptom:** Specific endpoint returns 404
   - **Fix:** Check `backend/server.js` includes payment routes
   - **Verify:** Routes are registered: `app.use('/api/payments', require('./src/routes/paymentRoutes'));`

4. **Incorrect Endpoint Path**
   - **Symptom:** Specific payment method fails
   - **Fix:** Check frontend is calling correct endpoint
   - **Example:** Should be `/api/payments/stripe/create-intent` not `/api/payment/stripe`

---

## Step-by-Step Debugging

### Step 1: Check Backend Server Logs
```bash
cd backend
npm start
# Look for error messages in console
```

### Step 2: Verify Environment Variables
```bash
# Backend
cd backend
cat .env | grep -E "(STRIPE|PAYPAL|FLUTTERWAVE|CHAPA)"

# Frontend
cd frontend
cat .env.local | grep -E "(API_URL|STRIPE|PAYPAL|FLUTTERWAVE|CHAPA)"
```

### Step 3: Test API Endpoints Directly
```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test payment endpoint (requires auth token)
curl -X POST http://localhost:8000/api/payments/stripe/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderId": "ORDER_ID"}'
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try making a payment
4. Check the failing request:
   - **Status Code:** 404 or 500?
   - **Request URL:** Is it correct?
   - **Response:** What error message?

### Step 5: Verify Payment Gateway Status
- **Stripe:** Check [Stripe Status](https://status.stripe.com)
- **PayPal:** Check [PayPal Status](https://www.paypal-status.com)
- **Flutterwave:** Check their status page
- **Chapa:** Check their status page

---

## Common Configuration Mistakes

### Mistake 1: Using Placeholder Values
❌ **Wrong:**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

✅ **Correct:**
```env
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Mistake 2: Wrong Port Numbers
❌ **Wrong:**
```env
# backend/.env
PORT=8000

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

✅ **Correct:**
```env
# backend/.env
PORT=8000

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Mistake 3: Missing API Prefix
❌ **Wrong:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

✅ **Correct:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Mistake 4: Not Restarting Server
After changing `.env` files, **always restart**:
- Backend server
- Frontend dev server

---

## Testing Checklist

Before reporting issues, verify:

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] MongoDB is running and connected
- [ ] All environment variables are set (no placeholder values)
- [ ] API keys are valid (test in payment gateway dashboard)
- [ ] Port numbers match between frontend and backend
- [ ] User is authenticated (check localStorage for token)
- [ ] Cart has items before checkout
- [ ] Network tab shows correct API calls

---

## Getting Help

If errors persist:

1. **Check Server Logs:** Backend console will show detailed errors
2. **Check Browser Console:** Frontend errors and network requests
3. **Verify Configuration:** Use the checklist above
4. **Test Payment Gateway:** Try creating a payment directly in gateway dashboard
5. **Check Documentation:** See `PAYMENT_SETUP_GUIDE.md` for detailed setup

---

## Error Messages You'll See

### "Stripe is not configured"
→ Set `STRIPE_SECRET_KEY` in `backend/.env`

### "PayPal is not configured"
→ Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `backend/.env`

### "Flutterwave is not configured"
→ Set `FLUTTERWAVE_SECRET_KEY` in `backend/.env`

### "Chapa is not configured"
→ Set `CHAPA_SECRET_KEY` in `backend/.env`

### "Order not found"
→ Order creation failed or order doesn't belong to user

### "Payment failed"
→ Check server logs for specific gateway error

### "Not found - /api/payments/..."
→ Check route is registered in `backend/server.js`
