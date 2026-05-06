const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateResetToken } = require('../utils/helpers');
const { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } = require('../utils/email');

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const { token: verifyToken, hashedToken: hashedVerifyToken } = generateResetToken();

    const user = await User.create({ name, email, password, emailVerifyToken: hashedVerifyToken });

    try {
      await sendWelcomeEmail(user);
    } catch {}

    try {
      await sendVerificationEmail(user, verifyToken);
    } catch {}

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, mfaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password +mfaSecret +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    if (!user.emailVerified) {
      try {
        const { token: verifyToken, hashedToken: hashedVerifyToken } = generateResetToken();
        await User.findByIdAndUpdate(user._id, { emailVerifyToken: hashedVerifyToken });
        await sendVerificationEmail(user, verifyToken);
      } catch {}
      return res.status(403).json({ success: false, message: 'Please verify your email. We just sent you a new verification link.' });
    }

    if (user.mfaEnabled) {
      if (!mfaToken) {
        return res.status(200).json({ success: true, requiresMfa: true, message: 'MFA token required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 1,
      });
      if (!verified) {
        return res.status(401).json({ success: false, message: 'Invalid MFA token' });
      }
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const updatedTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

    setCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken && req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    const updatedTokens = user.refreshTokens.filter((t) => t !== token);
    updatedTokens.push(newRefreshToken);
    await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

    setCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
    }

    const { token, hashedToken } = generateResetToken();

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });

    try {
      await sendPasswordResetEmail(user, token);
    } catch (emailErr) {
      await User.findByIdAndUpdate(user._id, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });
      return res.status(500).json({ success: false, message: 'Failed to send reset email' });
    }

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    next(error);
  }
};

// @GET /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ emailVerifyToken: hashedToken });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/mfa/setup
const setupMfa = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `ShopL (${req.user.email})`,
      length: 20,
    });

    await User.findByIdAndUpdate(req.user._id, { mfaSecret: secret.base32 });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: { qrCode: qrCodeUrl, secret: secret.base32 },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/mfa/verify
const verifyMfa = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+mfaSecret');

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid MFA token' });
    }

    await User.findByIdAndUpdate(req.user._id, { mfaEnabled: true });

    res.json({ success: true, message: 'MFA enabled successfully' });
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/mfa/disable
const disableMfa = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+mfaSecret');

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid MFA token' });
    }

    await User.findByIdAndUpdate(req.user._id, { mfaEnabled: false, mfaSecret: undefined });

    res.json({ success: true, message: 'MFA disabled successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, refreshToken, forgotPassword, resetPassword, verifyEmail, setupMfa, verifyMfa, disableMfa };
