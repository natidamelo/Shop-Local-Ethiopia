/**
 * One-time admin creation script.
 * Run via Render Shell: node src/utils/create-admin.js [password]
 * Default password: Admin@123
 */
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'kinfenati7@gmail.com';
const ADMIN_NAME = 'Kinfenati';
const ADMIN_PASSWORD = process.argv[2] || 'Admin@123';

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopl';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (user) {
    // Promote existing user to admin and verify email
    user.role = 'admin';
    user.emailVerified = true;
    user.isSuspended = false;
    if (process.argv[2]) {
      // Only update password if explicitly provided as argument
      user.password = ADMIN_PASSWORD;
    }
    await user.save();
    console.log(`✅ Updated ${ADMIN_EMAIL} → role: admin, emailVerified: true`);
  } else {
    // Create fresh admin
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      emailVerified: true,
    });
    console.log(`✅ Created admin: ${ADMIN_EMAIL}`);
  }

  console.log(`🔑 Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
