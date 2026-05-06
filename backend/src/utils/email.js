const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  };
  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ShopL</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Password Reset - ShopL', html });
};

const sendVerificationEmail = async (user, verifyToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Verify your email</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Welcome to ShopL, ${user.name}!</h2>
        <p>To complete your registration and secure your account, please confirm that this is your email address.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0;">
          Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${verifyUrl}</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Verify your email - ShopL', html });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ShopL</h1>
      </div>
      <div style="padding: 30px;">
        <h2>Order Confirmed! 🎉</h2>
        <p>Hi ${user.name}, your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; margin-top: 20px;">
          <p>Subtotal: <strong>$${order.subtotal.toFixed(2)}</strong></p>
          <p>Shipping: <strong>$${order.shippingCost.toFixed(2)}</strong></p>
          <p style="font-size: 18px;">Total: <strong>$${order.total.toFixed(2)}</strong></p>
        </div>
        <a href="${process.env.CLIENT_URL}/dashboard/orders/${order._id}" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">
          View Order
        </a>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Order Confirmed - ${order.orderNumber}`, html });
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to ShopL!</h1>
      </div>
      <div style="padding: 30px;">
        <h2>Hi ${user.name}! 👋</h2>
        <p>Welcome to ShopL - your one-stop shop for everything you need.</p>
        <p>Start exploring our products and enjoy a seamless shopping experience.</p>
        <a href="${process.env.CLIENT_URL}/shop" 
           style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">
          Start Shopping
        </a>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to ShopL!', html });
};

const sendLowStockAlert = async (product) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
  if (!adminEmail) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Low Stock Alert</h1>
      </div>
      <div style="padding: 30px;">
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px; color: #92400e;">⚠️ Stock Running Low</h2>
          <p style="margin: 0; color: #78350f;">A product has reached its low stock threshold and needs attention.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">Product:</td>
            <td style="padding: 8px 0; font-weight: bold;">${product.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">SKU:</td>
            <td style="padding: 8px 0;">${product.sku || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Current Stock:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #dc2626;">${product.stock} units</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Threshold:</td>
            <td style="padding: 8px 0;">${product.lowStockThreshold} units</td>
          </tr>
        </table>
        <a href="${process.env.CLIENT_URL}/admin/inventory" 
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
          Manage Inventory
        </a>
      </div>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `⚠️ Low Stock: ${product.name} (${product.stock} left)`, html });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendVerificationEmail, sendOrderConfirmationEmail, sendWelcomeEmail, sendLowStockAlert };
