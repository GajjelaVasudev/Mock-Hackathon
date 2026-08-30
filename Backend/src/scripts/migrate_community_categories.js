globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const mongoose = require('mongoose');
const ExperiencePost = require('../models/experiencePost.model');
const {
  CANONICAL_CATEGORIES,
  extractAndNormalizeHashtags,
  determinePostCategory,
} = require('../utils/communityTaxonomy');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const posts = await ExperiencePost.find({});
  let updatedCount = 0;
  const categoryCounts = {};
  CANONICAL_CATEGORIES.forEach((c) => (categoryCounts[c] = 0));

  for (const post of posts) {
    const rawContent = post.content || '';
    const existingTags = post.hashtags || [];
    const normalizedTags = extractAndNormalizeHashtags(rawContent, existingTags);

    const canonicalCat = determinePostCategory({
      explicitCategory: post.category || post.activityCategory,
      content: rawContent,
      hashtags: normalizedTags,
      activityCategory: post.activityCategory,
    });

    categoryCounts[canonicalCat] = (categoryCounts[canonicalCat] || 0) + 1;

    // Check if update is needed
    const tagsChanged =
      !post.hashtags ||
      post.hashtags.length !== normalizedTags.length ||
      post.hashtags.some((t, i) => t !== normalizedTags[i]);
    const catChanged = post.category !== canonicalCat;

    if (tagsChanged || catChanged) {
      await ExperiencePost.updateOne(
        { _id: post._id },
        {
          $set: {
            category: canonicalCat,
            hashtags: normalizedTags,
            activityCategory: canonicalCat,
          },
        }
      );
      updatedCount++;
    }
  }

  console.log('=== BNHS COMMUNITY CATEGORY MIGRATION ===');
  console.log(`Total posts examined: ${posts.length}`);
  console.log(`Updated posts: ${updatedCount}`);
  console.log('Category breakdown:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > 0) {
      console.log(`  - ${cat}: ${count}`);
    }
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
