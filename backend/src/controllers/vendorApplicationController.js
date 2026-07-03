const VendorApplication = require('../models/VendorApplication');
const Settings = require('../models/Settings');
const {
  notifyAdminNewApplication,
  notifyVendorApproved,
  notifyVendorRejected,
} = require('../utils/vendorNotifications');

// @POST /api/vendor-applications
// Public endpoint to submit a new vendor/bazar application
const createVendorApplication = async (req, res, next) => {
  try {
    // Check if registration is currently open
    const settings = await Settings.getSingleton();
    const br = settings.bazarRegistration || {};
    const now = new Date();
    let isRegistrationOpen = br.isOpen || false;
    if (br.scheduledOpenAt || br.scheduledCloseAt) {
      const afterOpen = br.scheduledOpenAt ? now >= new Date(br.scheduledOpenAt) : true;
      const beforeClose = br.scheduledCloseAt ? now <= new Date(br.scheduledCloseAt) : true;
      isRegistrationOpen = afterOpen && beforeClose;
    }

    if (!isRegistrationOpen) {
      return res.status(400).json({
        success: false,
        message: br.closedMessage || 'Vendor registration is currently closed. Please check back later.',
      });
    }

    const {
      vendorType,
      displayName,
      productType,
      tableType,
      productShortDescription,
      hasPreviousBazarExperience,
      previousBazarDetails,
      email,
      phone,
      salesPersonName,
      photoLinks,
      videoLink,
      socialLinks,
      agreeToRules,
      needElectricity,
    } = req.body;

    if (!vendorType || !displayName || !productType || !productShortDescription || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const normalizedTableType =
      tableType && ['full', 'half'].includes(tableType) ? tableType : 'full';

    const application = await VendorApplication.create({
      vendorType,
      displayName,
      productType,
      tableType: normalizedTableType,
      productShortDescription,
      hasPreviousBazarExperience: !!hasPreviousBazarExperience,
      previousBazarDetails: previousBazarDetails || '',
      email,
      phone,
      salesPersonName: salesPersonName || '',
      photoLinks: Array.isArray(photoLinks)
        ? photoLinks
        : typeof photoLinks === 'string' && photoLinks.trim()
        ? photoLinks
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
      videoLink: videoLink || '',
      socialLinks: socialLinks || '',
      agreeToRules: !!agreeToRules,
      needElectricity: !!needElectricity,
      applicantUser: req.user ? req.user._id : null,
    });

    // Fire-and-forget: notify admin via email, Telegram, WhatsApp
    notifyAdminNewApplication(application).catch((err) =>
      console.error('[VendorNotify] admin new-application notification failed:', err.message)
    );

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/vendor-applications/my
// Get applications submitted by the logged-in user
const getMyVendorApplications = async (req, res, next) => {
  try {
    const applications = await VendorApplication.find({ applicantUser: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

// ---- Admin endpoints ----

// @GET /api/admin/vendor-applications
// Query params: status=pending|approved|rejected (optional)
const getAllVendorApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const applications = await VendorApplication.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/vendor-applications/:id
const getVendorApplicationById = async (req, res, next) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/admin/vendor-applications/:id
// Body: { status?, paymentStatus?, adminNotes? }
const updateVendorApplicationAdmin = async (req, res, next) => {
  try {
    const { status, paymentStatus, adminNotes } = req.body;

    const updates = {};

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      updates.status = status;
      if (status === 'approved') {
        updates.approvedAt = new Date();
        updates.rejectedAt = undefined;
        // Set or refresh a 48-hour payment window when an application is approved
        const paymentWindowHours = 48;
        updates.paymentWindowExpiresAt = new Date(Date.now() + paymentWindowHours * 60 * 60 * 1000);
      } else if (status === 'rejected') {
        updates.rejectedAt = new Date();
        updates.approvedAt = undefined;
        updates.paymentWindowExpiresAt = undefined;
      } else {
        updates.approvedAt = undefined;
        updates.rejectedAt = undefined;
        updates.paymentWindowExpiresAt = undefined;
      }
    }

    if (paymentStatus) {
      if (!['pending', 'paid', 'not_required'].includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid paymentStatus value' });
      }
      updates.paymentStatus = paymentStatus;
    }

    if (typeof adminNotes === 'string') {
      updates.adminNotes = adminNotes;
    }

    const application = await VendorApplication.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Fire-and-forget vendor notifications when status changes
    if (status === 'approved') {
      Settings.getSingleton()
        .then((settings) => {
          const pricing = settings?.bazarTablePricing?.toObject?.() || settings?.bazarTablePricing || null;
          return notifyVendorApproved(application, pricing);
        })
        .catch((err) =>
          console.error('[VendorNotify] approved notification failed:', err.message)
        );
    } else if (status === 'rejected') {
      notifyVendorRejected(application).catch((err) =>
        console.error('[VendorNotify] rejected notification failed:', err.message)
      );
    }

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

// @GET /api/admin/vendor-applications/stats
const getVendorApplicationStats = async (req, res, next) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      VendorApplication.countDocuments({ status: 'pending' }),
      VendorApplication.countDocuments({ status: 'approved' }),
      VendorApplication.countDocuments({ status: 'rejected' }),
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVendorApplication,
  getMyVendorApplications,
  getAllVendorApplications,
  getVendorApplicationById,
  updateVendorApplicationAdmin,
  getVendorApplicationStats,
};

