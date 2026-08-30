globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {
  CANONICAL_CATEGORIES,
  CATEGORY_HASHTAG_MAP,
  normalizeHashtag,
  extractAndNormalizeHashtags,
  normalizeCategoryName,
  determinePostCategory,
} = require('./utils/communityTaxonomy');

const ExperiencePost = require('./models/experiencePost.model');
const User = require('./models/user.model');

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Cookie'] = 'token=' + token;
      headers['Authorization'] = 'Bearer ' + token;
    }
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 BNHS COMMUNITY CATEGORY & HASHTAG TAXONOMY TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let total = 17;

  // 1. #flora -> Trees & Flora
  const cat1 = determinePostCategory({ content: 'Spotted rare #flora today' });
  if (cat1 === 'Trees & Flora') {
    console.log('✓ PASS: 1. #flora → Trees & Flora');
    passed++;
  } else {
    console.error(`✗ FAIL: 1. #flora expected Trees & Flora, got ${cat1}`);
  }

  // 2. #trees -> Trees & Flora
  const cat2 = determinePostCategory({ content: 'Tall ancient #trees in the forest' });
  if (cat2 === 'Trees & Flora') {
    console.log('✓ PASS: 2. #trees → Trees & Flora');
    passed++;
  } else {
    console.error(`✗ FAIL: 2. #trees expected Trees & Flora, got ${cat2}`);
  }

  // 3. #botany -> Trees & Flora
  const cat3 = determinePostCategory({ content: 'Field observation #botany session' });
  if (cat3 === 'Trees & Flora') {
    console.log('✓ PASS: 3. #botany → Trees & Flora');
    passed++;
  } else {
    console.error(`✗ FAIL: 3. #botany expected Trees & Flora, got ${cat3}`);
  }

  // 4. #flamingo -> Birds
  const cat4 = determinePostCategory({ content: 'Pink migratory #flamingo flock at Sewri mudflats' });
  if (cat4 === 'Birds') {
    console.log('✓ PASS: 4. #flamingo → Birds');
    passed++;
  } else {
    console.error(`✗ FAIL: 4. #flamingo expected Birds, got ${cat4}`);
  }

  // 5. #birdwatching -> Birds
  const cat5 = determinePostCategory({ content: 'Morning #birdwatching at Karnala' });
  if (cat5 === 'Birds') {
    console.log('✓ PASS: 5. #birdwatching → Birds');
    passed++;
  } else {
    console.error(`✗ FAIL: 5. #birdwatching expected Birds, got ${cat5}`);
  }

  // 6. #intertidal -> Marine
  const cat6 = determinePostCategory({ content: 'Rocky shore #intertidal organisms at Haji Ali' });
  if (cat6 === 'Marine') {
    console.log('✓ PASS: 6. #intertidal → Marine');
    passed++;
  } else {
    console.error(`✗ FAIL: 6. #intertidal expected Marine, got ${cat6}`);
  }

  // 7. #conservation -> Conservation
  const cat7 = determinePostCategory({ content: 'Community mangrove #conservation initiative' });
  if (cat7 === 'Conservation') {
    console.log('✓ PASS: 7. #conservation → Conservation');
    passed++;
  } else {
    console.error(`✗ FAIL: 7. #conservation expected Conservation, got ${cat7}`);
  }

  // 8. #fieldcamp -> Field Camps
  const cat8 = determinePostCategory({ content: 'Night herping during our western ghats #fieldcamp' });
  if (cat8 === 'Field Camps') {
    console.log('✓ PASS: 8. #fieldcamp → Field Camps');
    passed++;
  } else {
    console.error(`✗ FAIL: 8. #fieldcamp expected Field Camps, got ${cat8}`);
  }

  // 9. #volunteering -> Volunteering
  const cat9 = determinePostCategory({ content: 'Great day of #volunteering for bird ringing digitisation' });
  if (cat9 === 'Volunteering') {
    console.log('✓ PASS: 9. #volunteering → Volunteering');
    passed++;
  } else {
    console.error(`✗ FAIL: 9. #volunteering expected Volunteering, got ${cat9}`);
  }

  // 10. #butterflies -> Insects
  const cat10 = determinePostCategory({ content: 'Blue Mormon and Common Mormon #butterflies' });
  if (cat10 === 'Insects') {
    console.log('✓ PASS: 10. #butterflies → Insects');
    passed++;
  } else {
    console.error(`✗ FAIL: 10. #butterflies expected Insects, got ${cat10}`);
  }

  // 11. Explicit category overrides inferred category
  const cat11 = determinePostCategory({
    explicitCategory: 'Trees & Flora',
    content: 'We also saw a beautiful bird #birdwatching during our tree walk',
  });
  if (cat11 === 'Trees & Flora') {
    console.log('✓ PASS: 11. Explicit category overrides inferred category');
    passed++;
  } else {
    console.error(`✗ FAIL: 11. Expected Trees & Flora, got ${cat11}`);
  }

  // 12. Multiple hashtags are normalized
  const normTags = extractAndNormalizeHashtags('Observing #Marine-Life and #Ocean and #marine', ['#Coastal', 'coral']);
  const expectedTags = ['#marine-life', '#ocean', '#marine', '#coastal', '#coral'];
  const allNormalized = expectedTags.every((t) => normTags.includes(t)) && normTags.length === 5;
  if (allNormalized) {
    console.log('✓ PASS: 12. Multiple hashtags are normalized and deduped');
    passed++;
  } else {
    console.error(`✗ FAIL: 12. Normalization failed: ${JSON.stringify(normTags)}`);
  }

  // DB Connection & API Endpoints Verification
  await mongoose.connect(process.env.MONGODB_URI);

  const existingUser = (await User.findOne({ isEmailVerified: true })) || (await User.findOne({}));
  if (!existingUser) {
    console.error('No user found in MongoDB for API tests');
    process.exit(1);
  }

  const token = jwt.sign(
    { id: existingUser._id, role: existingUser.role || 'user', email: existingUser.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  // 13. API Check: Post Creation with #flora in "Trees & Flora"
  const createRes = await makeRequest(
    '/api/community/experiences',
    'POST',
    {
      category: 'Trees & Flora',
      content: 'Beautiful native tree spotted during today nature walk. #flora #trees #botany',
    },
    token
  );
  const createdPostId = createRes.data?.post?._id;

  // 14. API Check: Category Filter returns only exact category matches
  const treesRes = await makeRequest('/api/community/feed?category=Trees%20%26%20Flora', 'GET', null, token);
  const foundInTrees = (treesRes.data?.posts || []).some((p) => p._id === createdPostId);

  const birdsRes = await makeRequest('/api/community/feed?category=Birds', 'GET', null, token);
  const foundInBirds = (birdsRes.data?.posts || []).some((p) => p._id === createdPostId);

  if (foundInTrees && !foundInBirds) {
    console.log('✓ PASS: 13. Category filter returns exact matches (in Trees & Flora, not in Birds)');
    passed++;
  } else {
    console.error(`✗ FAIL: 13. foundInTrees=${foundInTrees}, foundInBirds=${foundInBirds}`);
  }

  // 15. API Check: Hashtag filter works independently
  const hashtagRes = await makeRequest('/api/community/feed?hashtag=flora', 'GET', null, token);
  const foundInHashtag = (hashtagRes.data?.posts || []).some((p) => p._id === createdPostId);
  if (foundInHashtag) {
    console.log('✓ PASS: 14. Hashtag filter ?hashtag=flora works independently from category');
    passed++;
  } else {
    console.error('✗ FAIL: 14. Post not returned when filtering by #flora');
  }

  // 16. Existing posts migration verification in DB
  const unmigratedCount = await ExperiencePost.countDocuments({ category: { $exists: false } });
  if (unmigratedCount === 0) {
    console.log('✓ PASS: 15. All existing posts have canonical category field');
    passed++;
  } else {
    console.error(`✗ FAIL: 15. Found ${unmigratedCount} posts without category field`);
  }

  // 17. Dynamic sidebar counts are real numbers from DB
  const feedRes = await makeRequest('/api/community/feed', 'GET', null, token);
  const hasDynamicHashtags =
    Array.isArray(feedRes.data?.hashtags) &&
    feedRes.data?.hashtags.length > 0 &&
    feedRes.data?.hashtags.every((h) => typeof h.tag === 'string' && typeof h.count === 'number');

  if (hasDynamicHashtags) {
    console.log(`✓ PASS: 16. Dynamic sidebar hashtags return genuine counts (${feedRes.data.hashtags.length} tags tracked)`);
    passed++;
  } else {
    console.error('✗ FAIL: 16. Dynamic hashtags not returned correctly');
  }

  // 18. Unauthenticated users cannot create posts
  const unauthRes = await makeRequest('/api/community/experiences', 'POST', { content: 'Unauthenticated test #flora' });
  if (unauthRes.status === 401) {
    console.log('✓ PASS: 17. Unauthenticated user rejected with 401');
    passed++;
  } else {
    console.error(`✗ FAIL: 17. Unauthenticated user received status ${unauthRes.status}`);
  }

  // Clean up test post
  if (createdPostId) {
    await ExperiencePost.deleteOne({ _id: createdPostId });
  }

  await mongoose.disconnect();

  console.log('\n========================================================');
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('========================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
