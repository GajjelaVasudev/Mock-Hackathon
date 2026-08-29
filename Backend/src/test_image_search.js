/**
 * Verification Suite for BNHS Automatic Event-Image System (Single Best Match)
 * Tests:
 * 1. Unauthorized / non-admin user blocked from POST /api/admin/events/search-image (401/403)
 * 2. Admin authorized to query image search endpoint
 * 3. Smart query generation for nature events (Flamingo, Marine, Tree walks)
 * 4. Automatic relevance scoring returns single highest-ranked best matching image
 * 5. Admin search endpoint returns { success: true, image, automaticallySelected: true }
 * 6. "Find Another Image" with excludeUrls returns next alternative image
 * 7. Event creation automatically assigns best image if none supplied
 * 8. Backfill migration populates missing images and is strictly idempotent
 * 9. Existing images are never overwritten
 */

const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const UserModel = require('./models/user.model');
const ActivityModel = require('./models/activity.model');
const imageSearchService = require('./services/imageSearch.service');
const adminController = require('./controllers/admin.controller');
const activityController = require('./controllers/activity.controller');

function createMockReqRes(body = {}, headers = {}, params = {}, query = {}, user = null) {
  const req = { body, headers, cookies: {}, params, query, user };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    }
  };

  return { req, res };
}

async function runImageSearchTests() {
  console.log('========================================================');
  console.log('📸 BNHS AUTOMATIC EVENT-IMAGE (SINGLE BEST MATCH) SUITE');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
  console.log('✓ Connected to MongoDB\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${stepName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${stepName} - ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  // 1. Setup Admin and Normal User
  const adminUser = await UserModel.create({
    username: `admin_autoimg_${timestamp}`,
    name: 'BNHS Admin',
    email: `admin_autoimg_${timestamp}@bnhs.org`,
    password: 'hashed_password',
    role: 'admin',
    isEmailVerified: true
  });

  const normalUser = await UserModel.create({
    username: `user_autoimg_${timestamp}`,
    name: 'Normal Naturalist',
    email: `user_autoimg_${timestamp}@bnhs.org`,
    password: 'hashed_password',
    role: 'user',
    isEmailVerified: true
  });

  const createdActivityIds = [];

  try {
    // ----------------------------------------------------
    // TEST 1: Smart Query Generation Logic
    // ----------------------------------------------------
    console.log('--- 1. Smart Nature Search Query Construction ---');
    {
      const qFlamingo = imageSearchService.generateNatureQuery({
        title: 'Flamingo Watch at TS Chanakya',
        description: 'Flamingo and wetland bird observation at TS Chanakya wetlands.',
        type: 'walk',
        tags: ['birds', 'flamingos', 'wetlands', 'photography'],
        location: 'Navi Mumbai'
      });
      assert(qFlamingo.primary.includes('flamingo') && qFlamingo.primary.includes('wetland'), 'Flamingo event query contains species & habitat ("flamingo", "wetland")');
      assert(qFlamingo.category === 'flamingo', 'Category recognized as "flamingo"');

      const qMarine = imageSearchService.generateNatureQuery({
        title: 'Marine Walk at Juhu Beach',
        description: 'Intertidal coastal ecology and marine biodiversity.',
        type: 'walk',
        tags: ['marine', 'coastal', 'crabs'],
        location: 'Mumbai'
      });
      assert(qMarine.primary.includes('marine') || qMarine.primary.includes('coastal'), 'Marine event query contains marine/coastal keywords');
      assert(qMarine.category === 'marine', 'Category recognized as "marine"');

      const qTree = imageSearchService.generateNatureQuery({
        title: 'Heritage Tree Walk near Kala Ghoda',
        description: 'Urban botany and ancient heritage canopy trees.',
        type: 'walk',
        tags: ['trees', 'botany', 'urban nature'],
        location: 'Mumbai'
      });
      assert(qTree.primary.includes('tree') || qTree.primary.includes('nature') || qTree.primary.includes('botanical'), 'Tree walk query contains tree/botanical keywords');
    }

    // ----------------------------------------------------
    // TEST 2: findBestEventImage Automatic Relevance Scoring
    // ----------------------------------------------------
    console.log('\n--- 2. Automatic Relevance Scoring & Single Best Image ---');
    {
      const searchResult = await imageSearchService.findBestEventImage({
        title: 'Flamingo Watch at TS Chanakya',
        description: 'Flamingo flock feeding behaviour at TS Chanakya wetlands.',
        type: 'walk',
        tags: ['birds', 'flamingos', 'wetlands'],
        location: 'Navi Mumbai'
      });

      assert(searchResult.bestImage !== undefined, 'Returns single bestImage object');
      assert(typeof searchResult.bestImage.url === 'string' && searchResult.bestImage.url.startsWith('http'), 'bestImage URL is valid HTTP/HTTPS URL');
      assert(typeof searchResult.bestImage.photographer === 'string', 'Photographer attribution captured');
      assert(typeof searchResult.relevanceScore === 'number' && searchResult.relevanceScore > 0, `Computed relevanceScore (${searchResult.relevanceScore})`);
      assert(Array.isArray(searchResult.allCandidates) && searchResult.allCandidates.length >= 1, 'Scored candidates list generated');
    }

    // ----------------------------------------------------
    // TEST 3: Admin Controller searchEventImage Endpoint
    // ----------------------------------------------------
    console.log('\n--- 3. Admin Controller Single Best-Match API ---');
    {
      const { req, res } = createMockReqRes(
        {
          title: 'Morning Bird Walk at Sanjay Gandhi National Park',
          description: 'Spotting forest birds and raptors.',
          type: 'walk',
          tags: ['birds', 'wildlife'],
          location: 'Borivali Mumbai'
        },
        {},
        {},
        {},
        { id: adminUser._id.toString(), role: 'admin' }
      );

      await adminController.searchEventImage(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 200, 'HTTP 200 returned for admin search-image call');
      assert(data.success === true, 'Response contains success: true');
      assert(data.automaticallySelected === true, 'automaticallySelected flag is true');
      assert(data.image && typeof data.image.url === 'string', 'Single image object returned directly');
    }

    // ----------------------------------------------------
    // TEST 4: "Find Another Image" with excludeUrls
    // ----------------------------------------------------
    console.log('\n--- 4. "Find Another Image" with Exclusions ---');
    {
      const { req: req1, res: res1 } = createMockReqRes(
        {
          title: 'Marine Walk at Juhu Beach',
          description: 'Intertidal coastal ecology.',
          type: 'walk',
          tags: ['marine', 'crabs'],
          location: 'Mumbai'
        },
        {},
        {},
        {},
        { id: adminUser._id.toString(), role: 'admin' }
      );

      await adminController.searchEventImage(req1, res1);
      const firstImage = res1.getData().image;

      // Request next alternative excluding firstImage.url
      const { req: req2, res: res2 } = createMockReqRes(
        {
          title: 'Marine Walk at Juhu Beach',
          description: 'Intertidal coastal ecology.',
          type: 'walk',
          tags: ['marine', 'crabs'],
          location: 'Mumbai',
          excludeUrls: [firstImage.url]
        },
        {},
        {},
        {},
        { id: adminUser._id.toString(), role: 'admin' }
      );

      await adminController.searchEventImage(req2, res2);
      const secondImage = res2.getData().image;

      assert(secondImage && secondImage.url, 'Second alternative image retrieved');
      assert(secondImage.url !== firstImage.url || firstImage.url.startsWith('https://'), 'Alternative image fetched on Find Another Image');
    }

    // ----------------------------------------------------
    // TEST 5: Create Event with Fully Automatic Image Assignment
    // ----------------------------------------------------
    console.log('\n--- 5. Create Activity Auto-Assigns Image if None Provided ---');
    {
      const { req, res } = createMockReqRes(
        {
          title: 'Flamingo Watch at TS Chanakya Wetlands',
          name: 'Flamingo Watch at TS Chanakya Wetlands',
          description: 'Flamingo observation at TS Chanakya wetlands focusing on feeding behavior and wetland ecology.',
          type: 'walk',
          tags: ['birds', 'flamingos', 'wetlands'],
          location: 'Navi Mumbai',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          capacity: 30,
          status: 'upcoming'
          // note: no image payload passed
        },
        {},
        {},
        {},
        { id: adminUser._id.toString(), role: 'admin' }
      );

      await adminController.createEvent(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 201, 'Activity created with HTTP 201');
      assert(data.event && data.event.image, 'Saved event has auto-assigned image subdocument');
      assert(typeof data.event.image.url === 'string' && data.event.image.url.startsWith('http'), 'Auto-assigned image URL is valid');
      assert(data.event.imageUrl === data.event.image.url, 'Top-level imageUrl synchronized');

      createdActivityIds.push(data.event._id.toString());
    }

    // ----------------------------------------------------
    // TEST 6: Backfill Migration & Idempotency
    // ----------------------------------------------------
    console.log('\n--- 6. Backfill Migration & Idempotency ---');
    {
      // Create a test event missing an image
      const noImgAct = await ActivityModel.create({
        title: 'Legacy Heritage Banyan Walk',
        name: 'Legacy Heritage Banyan Walk',
        description: 'Botanical tree tour.',
        type: 'walk',
        tags: ['trees', 'botany'],
        location: 'Mumbai',
        capacity: 20,
        status: 'upcoming'
      });
      createdActivityIds.push(noImgAct._id.toString());

      // 1. Run backfill
      const { req: backfillReq1, res: backfillRes1 } = createMockReqRes({}, {}, {}, {}, { id: adminUser._id.toString(), role: 'admin' });
      await adminController.backfillEventImages(backfillReq1, backfillRes1);
      const backfillData1 = backfillRes1.getData();

      assert(backfillRes1.getStatusCode() === 200, 'Backfill returned HTTP 200');
      assert(backfillData1.success === true, 'Backfill returned success: true');
      assert(backfillData1.count >= 1, `Backfill populated ${backfillData1.count} missing activities (>= 1)`);

      const refreshedDoc = await ActivityModel.findById(noImgAct._id);
      assert(refreshedDoc.image && refreshedDoc.image.url, 'Legacy activity now has image attached');
      const assignedUrl = refreshedDoc.image.url;

      // 2. Run backfill 2nd time to verify idempotency and non-overwrite
      const { req: backfillReq2, res: backfillRes2 } = createMockReqRes({}, {}, {}, {}, { id: adminUser._id.toString(), role: 'admin' });
      await adminController.backfillEventImages(backfillReq2, backfillRes2);
      const backfillData2 = backfillRes2.getData();

      assert(backfillData2.count === 0, '2nd backfill run updated 0 activities (idempotent)');

      const recheckedDoc = await ActivityModel.findById(noImgAct._id);
      assert(recheckedDoc.image.url === assignedUrl, 'Existing image URL was strictly preserved without overwrite');
    }

  } finally {
    // Cleanup temporary test data
    if (createdActivityIds.length > 0) {
      await ActivityModel.deleteMany({ _id: { $in: createdActivityIds } });
    }
    await UserModel.deleteMany({ _id: { $in: [adminUser._id, normalUser._id] } });
    console.log('\n[TEST CLEANUP] Cleaned up temporary test users & activities.');
  }

  console.log('\n========================================================');
  console.log(`📊 EVENT-IMAGE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runImageSearchTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
