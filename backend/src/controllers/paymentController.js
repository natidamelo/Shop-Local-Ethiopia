function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('your_stripe')) return null;
  // Lazily create Stripe client so missing keys don't crash the server on startup
  return require('stripe')(key);
}
const axios = require('axios');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');

// ---- STRIPE ----

// @POST /api/payments/stripe/create-intent
const stripeCreateIntent = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
      return res.status(503).json({ 
        success: false, 
        message: 'Card payment is not available at the moment. Please choose another payment method.' 
      });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Card payment is not available at the moment. Please choose another payment method.',
      });
    }

    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'stripe',
      gatewayTransactionId: paymentIntent.id,
      amount: order.total,
      currency: order.currency,
      status: 'pending',
    });

    await Order.findByIdAndUpdate(order._id, { paymentId: payment._id.toString() });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentId: payment._id } });
  } catch (error) {
    next(error);
  }
};

// ---- PAYPAL ----

const getPayPalAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const baseUrl = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const response = await axios.post(
    `${baseUrl}/v1/oauth2/token`,
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return { token: response.data.access_token, baseUrl };
};

// @POST /api/payments/paypal/create-order
const paypalCreateOrder = async (req, res, next) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || 
        process.env.PAYPAL_CLIENT_ID.includes('your_paypal')) {
      return res.status(503).json({ 
        success: false, 
        message: 'PayPal is not available at the moment. Please choose another payment method.' 
      });
    }

    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { token, baseUrl } = await getPayPalAccessToken();

    const paypalOrder = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order._id.toString(),
            amount: { currency_code: order.currency, value: order.total.toFixed(2) },
          },
        ],
        application_context: {
          return_url: `${process.env.CLIENT_URL}/checkout/success`,
          cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'paypal',
      gatewayTransactionId: paypalOrder.data.id,
      amount: order.total,
      currency: order.currency,
      status: 'pending',
    });

    await Order.findByIdAndUpdate(order._id, { paymentId: payment._id.toString() });

    const approvalUrl = paypalOrder.data.links.find((l) => l.rel === 'approve')?.href;

    res.json({ success: true, data: { approvalUrl, paypalOrderId: paypalOrder.data.id, paymentId: payment._id } });
  } catch (error) {
    next(error);
  }
};

// @POST /api/payments/paypal/capture
const paypalCaptureOrder = async (req, res, next) => {
  try {
    const { paypalOrderId, paymentId } = req.body;
    const { token, baseUrl } = await getPayPalAccessToken();

    const capture = await axios.post(
      `${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    const captureStatus = capture.data.status;

    if (captureStatus === 'COMPLETED') {
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'completed',
        paidAt: new Date(),
        webhookData: capture.data,
      });

      const payment = await Payment.findById(paymentId);
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'paid',
        status: 'confirmed',
        $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via PayPal' } },
      });
    }

    res.json({ success: true, data: capture.data });
  } catch (error) {
    next(error);
  }
};

// ---- FLUTTERWAVE ----

// @POST /api/payments/flutterwave/initiate
const flutterwaveInitiate = async (req, res, next) => {
  try {
    if (!process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY.includes('your_flutterwave')) {
      return res.status(503).json({ 
        success: false, 
        message: 'Flutterwave is not available at the moment. Please choose another payment method.' 
      });
    }

    const { orderId, customerEmail, customerName, customerPhone } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const txRef = `SHOPL-FLW-${uuidv4()}`;

    const payload = {
      tx_ref: txRef,
      amount: order.total,
      currency: order.currency,
      redirect_url: `${process.env.CLIENT_URL}/checkout/success`,
      customer: {
        email: customerEmail || req.user.email,
        name: customerName || req.user.name,
        phonenumber: customerPhone || req.user.phone,
      },
      customizations: {
        title: 'ShopL Payment',
        logo: `${process.env.CLIENT_URL}/logo.png`,
      },
      meta: { orderId: order._id.toString() },
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    });

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'flutterwave',
      gatewayReference: txRef,
      amount: order.total,
      currency: order.currency,
      status: 'pending',
    });

    await Order.findByIdAndUpdate(order._id, { paymentId: payment._id.toString() });

    res.json({ success: true, data: { paymentLink: response.data.data.link, txRef, paymentId: payment._id } });
  } catch (error) {
    next(error);
  }
};

// ---- CHAPA (Ethiopian Banks) ----

// @POST /api/payments/chapa/initiate
const chapaInitiate = async (req, res, next) => {
  try {
    if (!process.env.CHAPA_SECRET_KEY || process.env.CHAPA_SECRET_KEY.includes('your_chapa')) {
      return res.status(503).json({ 
        success: false, 
        message: 'Chapa payment is not available at the moment. Please choose another payment method.' 
      });
    }

    const { orderId, customerEmail, customerFirstName, customerLastName, customerPhone, currency = 'ETB' } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const txRef = `SHOPL-CHAPA-${uuidv4()}`;

    const nameParts = req.user.name.split(' ');
    const payload = {
      amount: order.total,
      currency,
      email: customerEmail || req.user.email,
      first_name: customerFirstName || nameParts[0],
      last_name: customerLastName || nameParts.slice(1).join(' ') || 'User',
      phone_number: customerPhone || req.user.phone || '0900000000',
      tx_ref: txRef,
      callback_url: `${process.env.CLIENT_URL}/checkout/success`,
      return_url: `${process.env.CLIENT_URL}/checkout/success`,
      customization: {
        title: 'ShopL Payment',
        description: `Payment for order ${order.orderNumber}`,
      },
      meta: { orderId: order._id.toString() },
    };

    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', payload, {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'chapa',
      gatewayReference: txRef,
      amount: order.total,
      currency,
      status: 'pending',
    });

    await Order.findByIdAndUpdate(order._id, { paymentId: payment._id.toString() });

    res.json({
      success: true,
      data: {
        checkoutUrl: response.data.data.checkout_url,
        txRef,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/payments/chapa/verify
const chapaVerify = async (req, res, next) => {
  try {
    const { txRef } = req.params;

    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
    });

    const data = response.data.data;

    if (data.status === 'success') {
      const payment = await Payment.findOneAndUpdate(
        { gatewayReference: txRef },
        { status: 'completed', paidAt: new Date(), webhookData: data },
        { new: true }
      );

      if (payment) {
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: 'paid',
          status: 'confirmed',
          $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via Chapa' } },
        });
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @GET /api/payments/my-payments
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber total status');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  stripeCreateIntent,
  paypalCreateOrder,
  paypalCaptureOrder,
  flutterwaveInitiate,
  chapaInitiate,
  chapaVerify,
  getMyPayments,
};
