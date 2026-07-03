const Settings = require('../models/Settings');

// @GET /api/settings (public)
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({
      success: true,
      data: {
        siteName: settings.siteName || 'ShopL',
        logoUrl: settings.logoUrl || '',
        tagline: settings.tagline || '',
        contactEmail: settings.contactEmail || 'support@shopl.com',
        contactPhone: settings.contactPhone || '+251 911 000 000',
        contactAddress: settings.contactAddress || 'Addis Ababa, Ethiopia',
        whyChooseHeading: settings.whyChooseHeading || 'Why Choose',
        whyChooseSubtitle: settings.whyChooseSubtitle || 'The best shopping experience for Ethiopian cultural products.',
        whyChooseFeatures: (settings.whyChooseFeatures && settings.whyChooseFeatures.length >= 6)
          ? settings.whyChooseFeatures
          : [
              { title: 'Secure Payments', desc: 'Stripe, PayPal, Flutterwave, Telebirr & CBE Birr supported.' },
              { title: 'Fast Delivery', desc: 'Same-day in Addis Ababa, nationwide within 3–5 days.' },
              { title: 'Easy Returns', desc: '30-day hassle-free returns on all physical products.' },
              { title: '24/7 Support', desc: 'Round-the-clock support via chat, email, and phone.' },
              { title: 'Global Reach', desc: 'Multi-currency shopping from anywhere in the world.' },
              { title: 'Instant Digital', desc: 'Instant delivery for courses, downloads & software.' },
            ],
        trustBadges: settings.trustBadges && settings.trustBadges.length >= 3 ? settings.trustBadges : ['Free shipping over ETB 100', 'Secure checkout', '30-day returns'],
        hero: settings.hero || {},
        testimonials: settings.testimonials || [],
        welcomeCouponCode: settings.welcomeCouponCode || 'WELCOME10',
        welcomeDiscount: settings.welcomeDiscount || '10%',
        supportPages: settings.supportPages || {},
        navLinks: settings.navLinks && settings.navLinks.length > 0 ? settings.navLinks : [
          { href: '/shop', label: 'Shop' },
          { href: '/shop/hand-woven-textiles-and-apparel', label: 'Textiles & Apparel' },
          { href: '/shop/artisan-craft-and-home-decor', label: 'Artisan & Decor' },
          { href: '/shop?featured=true', label: 'Featured' },
          { href: '/bazar-vendor-apply', label: 'Join Bazar as Vendor' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/settings/bazar-registration (public)
// Returns whether vendor registration is currently open, considering the schedule
const getBazarRegistrationStatus = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const br = settings.bazarRegistration || {};
    const now = new Date();

    let isOpen = br.isOpen || false;

    // If a schedule window is set, auto-derive open status from the current time
    if (br.scheduledOpenAt || br.scheduledCloseAt) {
      const afterOpen = br.scheduledOpenAt ? now >= new Date(br.scheduledOpenAt) : true;
      const beforeClose = br.scheduledCloseAt ? now <= new Date(br.scheduledCloseAt) : true;
      isOpen = afterOpen && beforeClose;
    }

    const pricing = settings.bazarTablePricing || {};
    const rules = Array.isArray(settings.bazarRules) ? settings.bazarRules : [];
    const posterUrl = settings.bazarPosterUrl || '';
    res.json({
      success: true,
      data: {
        isOpen,
        scheduledOpenAt: br.scheduledOpenAt || null,
        scheduledCloseAt: br.scheduledCloseAt || null,
        closedMessage: br.closedMessage || 'Vendor registration is currently closed. Please check back later.',
        rules,
        pricing: {
          fullTablePrice: pricing.fullTablePrice ?? 0,
          halfTablePrice: pricing.halfTablePrice ?? 0,
          currency: pricing.currency || 'ETB',
          priceNote: pricing.priceNote || '',
        },
        posterUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/settings
const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/settings
const updateSettings = async (req, res, next) => {
  try {
    const { siteName, logoUrl, tagline, contactEmail, contactPhone, contactAddress, whyChooseHeading, whyChooseSubtitle, whyChooseFeatures, trustBadges, hero, testimonials, bazarRegistration, bazarTablePricing, bazarRules, welcomeCouponCode, welcomeDiscount, supportPages, bazarPosterUrl, navLinks } = req.body;
    const settings = await Settings.getSingleton();
    if (siteName !== undefined) settings.siteName = siteName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (tagline !== undefined) settings.tagline = tagline;
    if (contactEmail !== undefined) settings.contactEmail = String(contactEmail).trim() || settings.contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = String(contactPhone).trim() || settings.contactPhone;
    if (contactAddress !== undefined) settings.contactAddress = String(contactAddress).trim() || settings.contactAddress;
    if (whyChooseHeading !== undefined) settings.whyChooseHeading = String(whyChooseHeading).trim() || settings.whyChooseHeading;
    if (whyChooseSubtitle !== undefined) settings.whyChooseSubtitle = String(whyChooseSubtitle).trim() || settings.whyChooseSubtitle;
    if (whyChooseFeatures !== undefined && Array.isArray(whyChooseFeatures) && whyChooseFeatures.length >= 6) {
      settings.whyChooseFeatures = whyChooseFeatures.slice(0, 6).map((f) => ({ title: f.title || '', desc: f.desc || '' }));
      settings.markModified('whyChooseFeatures');
    }
    if (trustBadges !== undefined && Array.isArray(trustBadges) && trustBadges.length >= 3) {
      settings.trustBadges = trustBadges.slice(0, 3);
      settings.markModified('trustBadges');
    }
    if (testimonials !== undefined) {
      settings.testimonials = Array.isArray(testimonials) ? testimonials : settings.testimonials;
      settings.markModified('testimonials');
    }
    if (hero !== undefined) {
      settings.hero = { ...settings.hero?.toObject?.() || {}, ...hero };
      settings.markModified('hero');
    }
    if (bazarTablePricing !== undefined && typeof bazarTablePricing === 'object') {
      const current = settings.bazarTablePricing?.toObject?.() || {};
      settings.bazarTablePricing = {
        ...current,
        fullTablePrice: bazarTablePricing.fullTablePrice !== undefined ? Number(bazarTablePricing.fullTablePrice) : current.fullTablePrice,
        halfTablePrice: bazarTablePricing.halfTablePrice !== undefined ? Number(bazarTablePricing.halfTablePrice) : current.halfTablePrice,
        currency: bazarTablePricing.currency !== undefined ? String(bazarTablePricing.currency).trim() || 'ETB' : current.currency,
        priceNote: bazarTablePricing.priceNote !== undefined ? String(bazarTablePricing.priceNote) : current.priceNote,
      };
      settings.markModified('bazarTablePricing');
    }
    if (welcomeCouponCode !== undefined) settings.welcomeCouponCode = String(welcomeCouponCode).trim().toUpperCase() || settings.welcomeCouponCode;
    if (welcomeDiscount !== undefined) settings.welcomeDiscount = String(welcomeDiscount).trim() || settings.welcomeDiscount;
    if (bazarRules !== undefined && Array.isArray(bazarRules)) {
      settings.bazarRules = bazarRules
        .map((r) => (typeof r === 'string' ? r.trim() : ''))
        .filter((r) => r.length > 0);
      settings.markModified('bazarRules');
    }
    if (supportPages !== undefined && typeof supportPages === 'object') {
      const current = settings.supportPages?.toObject?.() || settings.supportPages || {};
      settings.supportPages = { ...current, ...supportPages };
      settings.markModified('supportPages');
    }
    if (bazarRegistration !== undefined && typeof bazarRegistration === 'object') {
      const current = settings.bazarRegistration?.toObject?.() || {};
      settings.bazarRegistration = {
        ...current,
        ...bazarRegistration,
        // Coerce dates properly
        scheduledOpenAt: bazarRegistration.scheduledOpenAt
          ? new Date(bazarRegistration.scheduledOpenAt)
          : (bazarRegistration.scheduledOpenAt === null ? null : current.scheduledOpenAt),
        scheduledCloseAt: bazarRegistration.scheduledCloseAt
          ? new Date(bazarRegistration.scheduledCloseAt)
          : (bazarRegistration.scheduledCloseAt === null ? null : current.scheduledCloseAt),
      };
      settings.markModified('bazarRegistration');
    }
    if (bazarPosterUrl !== undefined) {
      settings.bazarPosterUrl = String(bazarPosterUrl).trim();
    }
    if (navLinks !== undefined && Array.isArray(navLinks)) {
      settings.navLinks = navLinks
        .map((link) => ({
          label: String(link.label || '').trim(),
          href: String(link.href || '').trim(),
        }))
        .filter((link) => link.label && link.href);
      settings.markModified('navLinks');
    }
    await settings.save();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, getAdminSettings, updateSettings, getBazarRegistrationStatus };
