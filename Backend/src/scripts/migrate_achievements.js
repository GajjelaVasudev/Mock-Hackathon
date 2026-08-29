globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const mongoose = require('mongoose');

const UserModel = require('../models/user.model');
const AchievementModel = require('../models/achievement.model');
const { syncUserAchievements } = require('../services/achievement.service');

async function migrateAchievements() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const users = await UserModel.find({});
  console.log(`Scanning ${users.length} registered users for verified attendance achievements...`);

  let totalNewUnlocked = 0;
  const tierCounts = { SILVER: 0, GOLD: 0, PLATINUM: 0 };

  for (const user of users) {
    const { verifiedCount, achievements, newlyUnlocked } = await syncUserAchievements(user._id);

    achievements.forEach((ach) => {
      tierCounts[ach.tier] = (tierCounts[ach.tier] || 0) + 1;
    });

    if (newlyUnlocked.length > 0) {
      totalNewUnlocked += newlyUnlocked.length;
      console.log(`  -> User "${user.name || user.username}" (${user.email}): ${verifiedCount} verified events → Unlocked: ${newlyUnlocked.map((a) => a.tier).join(', ')}`);
    }
  }

  console.log('\n=== BNHS ACHIEVEMENTS MIGRATION COMPLETE ===');
  console.log(`Total users scanned: ${users.length}`);
  console.log(`Newly unlocked achievements created: ${totalNewUnlocked}`);
  console.log('Total active achievements in MongoDB:');
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`  - ${tier}: ${count}`);
  }

  await mongoose.disconnect();
}

migrateAchievements().catch((err) => {
  console.error('Achievement migration error:', err);
  process.exit(1);
});
