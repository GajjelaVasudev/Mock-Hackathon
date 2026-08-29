globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const assert = require('assert');

const User = require('./models/user.model');
const Activity = require('./models/activity.model');
const ExperiencePost = require('./models/experiencePost.model');
const Registration = require('./models/registration.model');

async function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Cookie'] = 'token=' + token;
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
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData || '{}') });
          } catch {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧪 RUNNING COMMUNITY OPEN POSTING & AUTHENTICATION SUITE...\n');

  // Find a user with 0 attended registrations
  const zeroAttendanceUser = await User.findOne({ username: 'persona_aarav' }) || await User.findOne({ role: 'user' });
  const tokenZero = jwt.sign({ id: zeroAttendanceUser._id.toString(), role: 'user' }, process.env.JWT_SECRET);

  // Find an activity
  const activity = await Activity.findOne({});

  // ----------------------------------------------------
  // TEST 1: Unauthenticated user -> rejected with 401
  // ----------------------------------------------------
  console.log('--- TEST 1: Unauthenticated User Request ---');
  const unauthRes = await makeRequest('/api/community/experiences', 'POST', {
    content: 'Attempting to post without login.',
  });
  console.log('Status (expected 401):', unauthRes.status);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated user must be rejected with 401');
  console.log('✓ PASS: Unauthenticated user rejected with 401\n');

  // ----------------------------------------------------
  // TEST 2: Authenticated user with 0 attended activities -> can create general post
  // ----------------------------------------------------
  console.log('--- TEST 2: Authenticated User with 0 Attended Activities (General Post) ---');
  const generalPostRes = await makeRequest(
    '/api/community/experiences',
    'POST',
    {
      content: 'Early morning birding observation from home balcony! #Birds #MorningSightings',
      category: 'Birds',
    },
    tokenZero
  );
  console.log('Status (expected 201):', generalPostRes.status, 'Message:', generalPostRes.body.message);
  assert.strictEqual(generalPostRes.status, 201, 'General post must be created successfully with 201');
  assert(generalPostRes.body.post, 'Returned post object must exist');
  assert.strictEqual(generalPostRes.body.post.activity, null, 'Activity must be null for general observation');
  const createdGeneralPostId = generalPostRes.body.post._id;
  console.log('✓ PASS: User with 0 attendance created post successfully (ID: ' + createdGeneralPostId + ')\n');

  // ----------------------------------------------------
  // TEST 3: Authenticated user creating post linked to an Activity
  // ----------------------------------------------------
  console.log('--- TEST 3: Authenticated User Creating Post Linked to Activity ---');
  const activityPostRes = await makeRequest(
    '/api/community/experiences',
    'POST',
    {
      activityId: activity.id || activity._id.toString(),
      content: `Wonderful naturalist trail at ${activity.name || activity.title}! #NatureTrail`,
    },
    tokenZero
  );
  console.log('Status (expected 201):', activityPostRes.status, 'Message:', activityPostRes.body.message);
  assert.strictEqual(activityPostRes.status, 201, 'Activity post must be created successfully with 201');
  assert(activityPostRes.body.post.activity, 'Activity reference must be attached');
  const createdActivityPostId = activityPostRes.body.post._id;
  console.log('✓ PASS: Activity-linked post created successfully (ID: ' + createdActivityPostId + ')\n');

  // ----------------------------------------------------
  // TEST 4: Like / Reaction toggle on the new post
  // ----------------------------------------------------
  console.log('--- TEST 4: Like Toggle on Newly Created Post ---');
  const likeRes = await makeRequest(
    `/api/community/experiences/${createdGeneralPostId}/reactions`,
    'POST',
    { type: 'like' },
    tokenZero
  );
  console.log('Status (expected 200):', likeRes.status, 'isLiked:', likeRes.body.isLiked);
  assert.strictEqual(likeRes.status, 200, 'Like toggle must succeed');
  assert.strictEqual(likeRes.body.isLiked, true, 'isLiked must be true');
  console.log('✓ PASS: Like interaction functions properly on general post\n');

  // ----------------------------------------------------
  // TEST 5: Comment on the new post
  // ----------------------------------------------------
  console.log('--- TEST 5: Add Comment on Post ---');
  const commentRes = await makeRequest(
    `/api/community/experiences/${createdGeneralPostId}/comments`,
    'POST',
    { content: 'Great sighting and photography!' },
    tokenZero
  );
  console.log('Status (expected 201):', commentRes.status, 'Comments count:', commentRes.body.commentsCount);
  assert.strictEqual(commentRes.status, 201, 'Comment creation must succeed');
  assert.strictEqual(commentRes.body.commentsCount, 1, 'Comment count must be 1');
  console.log('✓ PASS: Comment interaction functions properly\n');

  // ----------------------------------------------------
  // TEST 6: Bookmark / Save on the new post
  // ----------------------------------------------------
  console.log('--- TEST 6: Save / Bookmark on Post ---');
  const saveRes = await makeRequest(
    `/api/community/experiences/${createdGeneralPostId}/save`,
    'POST',
    null,
    tokenZero
  );
  console.log('Status (expected 200):', saveRes.status, 'isSaved:', saveRes.body.isSaved);
  assert.strictEqual(saveRes.status, 200, 'Save toggle must succeed');
  assert.strictEqual(saveRes.body.isSaved, true, 'isSaved must be true');
  console.log('✓ PASS: Bookmark / Save interaction functions properly\n');

  // ----------------------------------------------------
  // TEST 7: Delete post by owner
  // ----------------------------------------------------
  console.log('--- TEST 7: Delete Post by Owner ---');
  const deleteRes1 = await makeRequest(
    `/api/community/experiences/${createdGeneralPostId}`,
    'DELETE',
    null,
    tokenZero
  );
  const deleteRes2 = await makeRequest(
    `/api/community/experiences/${createdActivityPostId}`,
    'DELETE',
    null,
    tokenZero
  );
  console.log('Delete Res 1 Status:', deleteRes1.status, 'Delete Res 2 Status:', deleteRes2.status);
  assert.strictEqual(deleteRes1.status, 200, 'Delete must succeed');
  assert.strictEqual(deleteRes2.status, 200, 'Delete must succeed');
  console.log('✓ PASS: Clean post deletion verified\n');

  console.log('========================================================');
  console.log('🎉 ALL COMMUNITY OPEN POSTING CHECKS PASSED (7/7)');
  console.log('========================================================');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
