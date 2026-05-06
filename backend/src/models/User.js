const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    refreshTokens: [{ type: String, select: false }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    lastLogin: { type: Date },
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.mfaSecret;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerifyToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
