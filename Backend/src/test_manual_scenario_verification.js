globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const assert = require('assert');

const User = require('./models/user.model');
const ExperiencePost = require('./models/experiencePost.model');

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

async function runScenario() {
  console.log('========================================================');
  console.log('🔍 RUNNING USER REQUESTED EXACT SCENARIO VERIFICATION');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const user = (await User.findOne({ isEmailVerified: true })) || (await User.findOne({}));
  const token = jwt.sign(
    { id: user._id, role: user.role || 'user', email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  // Step 1: Create a post with Category: Trees & Flora, Caption: "Beautiful native tree spotted during today's nature walk.", Hashtag: #flora
  console.log('Step 1: Creating post with Category: Trees & Flora, Hashtag: #flora');
  const postRes = await makeRequest(
    '/api/community/experiences',
    'POST',
    {
      category: 'Trees & Flora',
      content: "Beautiful native tree spotted during today's nature walk. #flora",
    },
    token
  );

  assert.strictEqual(postRes.status, 201, 'Post creation should return 201');
  const postId = postRes.data.post._id;
  console.log(`✓ Post created successfully: ID=${postId}, category="${postRes.data.post.category}", hashtags=${JSON.stringify(postRes.data.post.hashtags)}`);
  assert.strictEqual(postRes.data.post.category, 'Trees & Flora', 'Post category must be Trees & Flora');

  // Step 2: Click "Trees & Flora" (?category=Trees%20%26%20Flora) -> MUST appear
  console.log('\nStep 2: Querying ?category=Trees%20%26%20Flora');
  const treesFeed = await makeRequest('/api/community/feed?category=Trees%20%26%20Flora', 'GET', null, token);
  const foundInTrees = (treesFeed.data.posts || []).some((p) => p._id === postId);
  console.log(`Result: Post present in "Trees & Flora" = ${foundInTrees}`);
  assert.strictEqual(foundInTrees, true, 'Post MUST appear in Trees & Flora');

  // Step 3: Click "Birds" (?category=Birds) -> MUST NOT appear
  console.log('\nStep 3: Querying ?category=Birds');
  const birdsFeed = await makeRequest('/api/community/feed?category=Birds', 'GET', null, token);
  const foundInBirds = (birdsFeed.data.posts || []).some((p) => p._id === postId);
  console.log(`Result: Post present in "Birds" = ${foundInBirds}`);
  assert.strictEqual(foundInBirds, false, 'Post MUST NOT appear in Birds');

  // Step 4: Click "#flora" (?hashtag=flora) -> MUST appear
  console.log('\nStep 4: Querying ?hashtag=flora');
  const floraFeed = await makeRequest('/api/community/feed?hashtag=flora', 'GET', null, token);
  const foundInFlora = (floraFeed.data.posts || []).some((p) => p._id === postId);
  console.log(`Result: Post present in "#flora" = ${foundInFlora}`);
  assert.strictEqual(foundInFlora, true, 'Post MUST appear under #flora hashtag');

  // Cleanup scenario post
  await ExperiencePost.deleteOne({ _id: postId });
  await mongoose.disconnect();

  console.log('\n========================================================');
  console.log('🎉 EXACT SCENARIO VERIFIED AND CONFIRMED 100% WORKING');
  console.log('========================================================');
}

runScenario().catch((err) => {
  console.error('Scenario verification failed:', err);
  process.exit(1);
});
