/**
 * Safe Migration Script: Backfill Missing / Enhance Event Images
 * Uses dual Pexels + Unsplash image providers to assign high-relevance,
 * non-repetitive wildlife & nature photography to BNHS activities in MongoDB.
 */

const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../../.env' });

const ActivityModel = require('../models/activity.model');
const imageSearchService = require('../services/imageSearch.service');

async function runBackfill(forceRefresh = false) {
  console.log('========================================================');
  console.log('🌱 BNHS PEXELS + UNSPLASH NON-REPETITIVE IMAGE BACKFILL');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
  console.log('✓ Connected to MongoDB\n');

  const query = forceRefresh
    ? {}
    : {
        $or: [
          { image: { $exists: false } },
          { image: null },
          { 'image.url': { $exists: false } },
          { 'image.url': null },
          { 'image.url': '' }
        ]
      };

  const activities = await ActivityModel.find(query);
  console.log(`Found ${activities.length} activities to process (forceRefresh: ${forceRefresh}).\n`);

  let updatedCount = 0;
  const sessionAssignedUrls = new Set();

  for (const act of activities) {
    const title = act.title || act.name || 'BNHS Nature Activity';
    console.log(`[Processing] "${title}" (${act.type} in ${act.location})...`);

    // If not forcing refresh and existing imageUrl string exists
    if (!forceRefresh && act.imageUrl && typeof act.imageUrl === 'string' && act.imageUrl.startsWith('http')) {
      act.image = {
        url: act.imageUrl,
        smallUrl: act.imageUrl,
        source: 'custom',
        photographer: 'BNHS',
        attributionUrl: '',
        alt: title
      };
      await act.save();
      sessionAssignedUrls.add(act.imageUrl);
      console.log(`  ✓ Converted existing imageUrl string to image subdocument.`);
      updatedCount++;
      continue;
    }

    try {
      const result = await imageSearchService.findBestEventImage({
        title,
        description: act.description,
        type: act.type,
        tags: act.tags?.length ? act.tags : (act.interests || []),
        location: act.location
      }, {
        excludeUrls: Array.from(sessionAssignedUrls)
      });

      if (result.bestImage && result.bestImage.url) {
        act.image = result.bestImage;
        act.imageUrl = result.bestImage.url;
        await act.save();
        sessionAssignedUrls.add(result.bestImage.url);
        console.log(`  ✓ [${result.bestImage.source.toUpperCase()}] Assigned: "${result.bestImage.alt}" (Score: ${result.relevanceScore}) by ${result.bestImage.photographer}`);
        updatedCount++;
      }
    } catch (err) {
      console.error(`  ✗ Error searching image for "${title}":`, err.message);
    }
  }

  console.log('\n========================================================');
  console.log(`🎉 BACKFILL COMPLETE: ${updatedCount} / ${activities.length} activities populated.`);
  console.log(`📸 Unique photographs assigned in this run: ${sessionAssignedUrls.size}`);
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

const isForce = process.argv.includes('--force') || process.argv.includes('--refresh');
runBackfill(isForce).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
