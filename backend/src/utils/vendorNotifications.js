const axios = require('axios');
const { sendEmail } = require('./email');

// ─── Telegram ────────────────────────────────────────────────────────────────
// Sends a message to a Telegram chat via the Bot API.
// Requires: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
const sendTelegram = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('[Telegram] notification failed:', err?.response?.data || err.message);
  }
};

// ─── WhatsApp via CallMeBot (free, no account needed beyond one-time setup) ──
// Requires: WHATSAPP_PHONE (international format, no +) and WHATSAPP_APIKEY in .env
// Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
const sendWhatsApp = async (message) => {
  const phone = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apiKey) return;
  try {
    const encoded = encodeURIComponent(message);
    await axios.get(
      `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`
    );
  } catch (err) {
    console.error('[WhatsApp] notification failed:', err?.response?.data || err.message);
  }
};

// ─── Email helpers ────────────────────────────────────────────────────────────
const adminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const emailWrap = (accentColor, headerText, bodyHtml) => `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <div style="background:${accentColor};padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.3px;">${headerText}</h1>
  </div>
  <div style="padding:28px 32px;background:#fafafa;">
    ${bodyHtml}
  </div>
  <div style="padding:16px 32px;background:#f3f4f6;text-align:center;font-size:11px;color:#9ca3af;">
    ShopL Bazar · Automated notification · Do not reply to this email
  </div>
</div>`;

const row = (label, value) =>
  `<tr>
    <td style="padding:7px 0;color:#6b7280;font-size:13px;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;font-size:13px;font-weight:600;color:#111827;">${value || '—'}</td>
  </tr>`;

// ─── 1. Admin: new vendor application received ────────────────────────────────
const notifyAdminNewApplication = async (application) => {
  const {
    displayName, vendorType, productType, tableType,
    email, phone, salesPersonName, needElectricity,
    hasPreviousBazarExperience, _id,
  } = application;

  const reviewUrl = `${process.env.CLIENT_URL}/admin/vendor-applications`;
  const tableLabel = tableType === 'half' ? 'Half table' : 'Full table';
  const vendorLabel = vendorType === 'enterprise' ? 'Enterprise' : 'Individual';

  // ── Email to admin ──
  const emailHtml = emailWrap(
    'linear-gradient(135deg,#d97706 0%,#92400e 100%)',
    '🏪 New Bazar Vendor Application',
    `<p style="font-size:14px;color:#374151;margin-top:0;">
      A new vendor has submitted a bazar application and is waiting for your review.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${row('Vendor name', displayName)}
      ${row('Type', vendorLabel)}
      ${row('Product / service', productType)}
      ${row('Table size', tableLabel)}
      ${row('Email', email)}
      ${row('Phone', phone)}
      ${salesPersonName ? row('Sales person', salesPersonName) : ''}
      ${row('Electricity needed', needElectricity ? 'Yes' : 'No')}
      ${row('Previous bazar', hasPreviousBazarExperience ? 'Yes' : 'No')}
    </table>
    <a href="${reviewUrl}"
       style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
      Review Application →
    </a>`
  );

  // ── Telegram / WhatsApp plain text ──
  const plainText =
    `🏪 <b>New Bazar Vendor Application</b>\n\n` +
    `👤 <b>${displayName}</b> (${vendorLabel})\n` +
    `📦 ${productType}\n` +
    `🪑 ${tableLabel}\n` +
    `📧 ${email}\n` +
    `📞 ${phone}\n` +
    `⚡ Electricity: ${needElectricity ? 'Yes' : 'No'}\n\n` +
    `👉 Review: ${reviewUrl}`;

  const whatsappText =
    `🏪 New Bazar Vendor Application\n\n` +
    `Vendor: ${displayName} (${vendorLabel})\n` +
    `Product: ${productType}\n` +
    `Table: ${tableLabel}\n` +
    `Email: ${email}\n` +
    `Phone: ${phone}\n` +
    `Electricity: ${needElectricity ? 'Yes' : 'No'}\n\n` +
    `Review at: ${reviewUrl}`;

  await Promise.allSettled([
    adminEmail()
      ? sendEmail({
          to: adminEmail(),
          subject: `🏪 New Vendor Application: ${displayName}`,
          html: emailHtml,
          text: whatsappText,
        })
      : Promise.resolve(),
    sendTelegram(plainText),
    sendWhatsApp(whatsappText),
  ]);
};

// ─── 2. Vendor: application approved ─────────────────────────────────────────
const notifyVendorApproved = async (application, pricing) => {
  const {
    displayName, email, phone, tableType,
    paymentWindowExpiresAt, adminNotes,
  } = application;

  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard/vendor-applications`;
  const tableLabel = tableType === 'half' ? 'Half table' : 'Full table';
  const currency = pricing?.currency || 'ETB';
  const price = tableType === 'half' ? pricing?.halfTablePrice : pricing?.fullTablePrice;
  const priceNote = pricing?.priceNote || '';
  const deadline = paymentWindowExpiresAt
    ? new Date(paymentWindowExpiresAt).toLocaleString('en-US', {
        dateStyle: 'medium', timeStyle: 'short',
      })
    : null;

  // ── Email to vendor ──
  const emailHtml = emailWrap(
    'linear-gradient(135deg,#059669 0%,#065f46 100%)',
    '✅ Your Bazar Application is Approved!',
    `<p style="font-size:15px;color:#374151;margin-top:0;">
      Congratulations, <strong>${displayName}</strong>! Your bazar vendor application has been <strong style="color:#059669;">approved</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${row('Table size', tableLabel)}
      ${price ? row('Participation fee', `<span style="color:#d97706;font-size:15px;">${currency} ${Number(price).toLocaleString()}</span>`) : ''}
      ${priceNote ? row('Note', priceNote) : ''}
      ${deadline ? row('Payment deadline', `<span style="color:#dc2626;">${deadline}</span>`) : ''}
      ${adminNotes ? row('Admin note', adminNotes) : ''}
    </table>
    ${deadline ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#92400e;">
      ⏰ <strong>Please complete your payment before ${deadline}.</strong> Failure to pay within the deadline may result in your spot being released.
    </div>` : ''}
    <a href="${dashboardUrl}"
       style="display:inline-block;background:#059669;color:#fff;padding:12px 28px;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
      View My Application →
    </a>`
  );

  // ── Telegram / WhatsApp ──
  const priceStr = price ? `\n💰 Fee: ${currency} ${Number(price).toLocaleString()}${priceNote ? ` (${priceNote})` : ''}` : '';
  const deadlineStr = deadline ? `\n⏰ Pay by: ${deadline}` : '';
  const notesStr = adminNotes ? `\n📝 Note: ${adminNotes}` : '';

  const plainText =
    `✅ <b>Bazar Application Approved!</b>\n\n` +
    `Congratulations <b>${displayName}</b>!\n` +
    `Your application for a <b>${tableLabel}</b> has been approved.` +
    priceStr + deadlineStr + notesStr +
    `\n\n👉 Dashboard: ${dashboardUrl}`;

  const whatsappText =
    `✅ Bazar Application Approved!\n\n` +
    `Congratulations ${displayName}!\n` +
    `Your ${tableLabel} application has been approved.` +
    priceStr.replace(/<[^>]+>/g, '') +
    deadlineStr + notesStr.replace(/<[^>]+>/g, '') +
    `\n\nDashboard: ${dashboardUrl}`;

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `✅ Your Bazar Application is Approved — ${displayName}`,
      html: emailHtml,
      text: whatsappText,
    }),
    // Also notify admin that they approved one
    adminEmail()
      ? sendTelegram(
          `✅ <b>Vendor Approved:</b> ${displayName} (${tableLabel})\n📧 ${email} · 📞 ${phone}`
        )
      : Promise.resolve(),
    sendWhatsApp(
      `✅ Vendor Approved: ${displayName} (${tableLabel})\nEmail: ${email} | Phone: ${phone}`
    ),
  ]);
};

// ─── 3. Vendor: application rejected ─────────────────────────────────────────
const notifyVendorRejected = async (application) => {
  const { displayName, email, adminNotes } = application;
  const applyUrl = `${process.env.CLIENT_URL}/bazar-vendor-apply`;

  const emailHtml = emailWrap(
    'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)',
    'Bazar Application Update',
    `<p style="font-size:15px;color:#374151;margin-top:0;">
      Dear <strong>${displayName}</strong>, thank you for your interest in our bazar.
      Unfortunately, your application was <strong style="color:#dc2626;">not approved</strong> at this time.
    </p>
    ${adminNotes ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#7f1d1d;">
      <strong>Reason / note from admin:</strong><br/>${adminNotes}
    </div>` : ''}
    <p style="font-size:13px;color:#6b7280;">
      You are welcome to apply again for a future bazar event. If you have questions, please contact us.
    </p>
    <a href="${applyUrl}"
       style="display:inline-block;background:#374151;color:#fff;padding:12px 28px;border-radius:7px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px;">
      Apply Again →
    </a>`
  );

  const notesStr = adminNotes ? `\nReason: ${adminNotes}` : '';
  const whatsappText =
    `❌ Bazar Application Update\n\nDear ${displayName}, your bazar application was not approved this time.` +
    notesStr + `\n\nApply again: ${applyUrl}`;

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `Bazar Application Update — ${displayName}`,
      html: emailHtml,
      text: whatsappText,
    }),
  ]);
};

module.exports = {
  notifyAdminNewApplication,
  notifyVendorApproved,
  notifyVendorRejected,
};
