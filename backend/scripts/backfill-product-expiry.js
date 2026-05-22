/**
 * Backfill expiresAt for listings created before expiry was enforced.
 * Run: node scripts/backfill-product-expiry.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const LISTING_EXPIRY_DAYS = 60;

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const missing = await Product.find({
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
    isSold: false,
  }).select('_id createdAt relistedAt title');

  let updated = 0;
  for (const product of missing) {
    const base = product.relistedAt || product.createdAt || new Date();
    const expiresAt = new Date(base.getTime() + LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await Product.updateOne({ _id: product._id }, { $set: { expiresAt, isExpired: false } });
    updated += 1;
    console.log(`Updated ${product.title} -> expires ${expiresAt.toISOString()}`);
  }

  console.log(`Done. Backfilled ${updated} of ${missing.length} products.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
