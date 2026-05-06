const mongoose = require('mongoose');

const vendorApplicationSchema = new mongoose.Schema(
  {
    vendorType: {
      type: String,
      enum: ['enterprise', 'individual'],
      required: true,
    },
    displayName: {
      // Enterprise name or individual vendor name
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      // Product or service type/category
      type: String,
      required: true,
      trim: true,
    },
    tableType: {
      // Full table or half table at the bazar
      type: String,
      enum: ['full', 'half'],
      default: 'full',
    },
    productShortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    hasPreviousBazarExperience: {
      type: Boolean,
      default: false,
    },
    previousBazarDetails: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    salesPersonName: {
      // Name of the person who will sell / stand at the table
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    photoLinks: {
      // Comma-separated or array of URLs where vendor hosts photos
      type: [String],
      default: [],
    },
    videoLink: {
      type: String,
      default: '',
      trim: true,
    },
    socialLinks: {
      type: String,
      default: '',
      trim: true,
    },
    agreeToRules: {
      type: Boolean,
      default: false,
    },
    needElectricity: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'not_required'],
      default: 'pending',
    },
    paymentWindowExpiresAt: {
      // Deadline for vendor to complete payment (e.g. 48 hours after approval)
      type: Date,
    },
    applicantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VendorApplication', vendorApplicationSchema);

