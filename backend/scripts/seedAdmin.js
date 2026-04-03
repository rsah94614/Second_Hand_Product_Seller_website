const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/mongodb');
const User = require('../models/User');

dotenv.config();

const resolveAdminEmail = () => {
  const cliEmail = process.argv[2]?.trim().toLowerCase();
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  return cliEmail || envEmail || '';
};

const promoteAdmin = async () => {
  const adminEmail = resolveAdminEmail();

  if (!adminEmail) {
    throw new Error(
      'Provide an email with `npm run seed:admin -- user@example.com` or set ADMIN_EMAIL in backend/.env'
    );
  }

  await connectDB();

  const user = await User.findOne({ email: adminEmail });

  if (!user) {
    throw new Error(`No user found with email ${adminEmail}. Register that account first, then run this script again.`);
  }

  user.role = 'admin';
  user.isActive = true;
  user.isVerified = true;
  await user.save();

  console.log(`Admin access granted to ${user.email}`);
};

promoteAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
