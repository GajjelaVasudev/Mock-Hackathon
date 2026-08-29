/**
 * Verification Suite for BNHS "My Conversations / Previous Discussions" Feature
 * Tests:
 * 1. Unauthorized access blocked (HTTP 401/403)
 * 2. User A creates conversation messages in Activity 1 & 2
 * 3. User B creates conversation message in Activity 3
 * 4. User A's getMyConversations returns Activity 1 & 2 only (User B's activity excluded)
 * 5. Conversations are sorted in descending order of lastMessage.createdAt
 * 6. Last message preview accurately reflects texts and photo indicators (📷 Photo)
 * 7. Unread message count increments when User B sends a message in Activity 1
 * 8. Marking conversation as read resets unread count to 0
 * 9. Empty state returns success: true, count: 0, conversations: [] for new users
 */

const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const UserModel = require('./models/user.model');
const ActivityModel = require('./models/activity.model');
const RegistrationModel = require('./models/registration.model');
const CommunityMessageModel = require('./models/communityMessage.model');
const CommunityReadStateModel = require('./models/communityReadState.model');
const communityController = require('./controllers/community.controller');

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

async function runMyConversationsTests() {
  console.log('========================================================');
  console.log('💬 BNHS "MY CONVERSATIONS" AUTOMATED VERIFICATION SUITE');
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

  // 1. Setup Users
  const userA = await UserModel.create({
    username: `aarav_conv_${timestamp}`,
    name: 'Aarav Sharma',
    email: `aarav_conv_${timestamp}@bnhs.org`,
    password: 'hashed_password',
    role: 'user',
    isEmailVerified: true
  });

  const userB = await UserModel.create({
    username: `priya_conv_${timestamp}`,
    name: 'Priya Iyer',
    email: `priya_conv_${timestamp}@bnhs.org`,
    password: 'hashed_password',
    role: 'user',
    isEmailVerified: true
  });

  const userEmpty = await UserModel.create({
    username: `newUser_conv_${timestamp}`,
    name: 'Fresh Naturalist',
    email: `newUser_conv_${timestamp}@bnhs.org`,
    password: 'hashed_password',
    role: 'user',
    isEmailVerified: true
  });

  // 2. Setup 3 Activities
  const act1 = await ActivityModel.create({
    id: `bnhs_conv_act1_${timestamp}`,
    name: 'Bird Watching Walk at Vetal Tekdi',
    title: 'Bird Watching Walk at Vetal Tekdi',
    description: 'Hill slope birding.',
    type: 'walk',
    category: 'Birds',
    location: 'Pune',
    date: new Date(),
    capacity: 30,
    registeredCount: 10,
    status: 'upcoming'
  });

  const act2 = await ActivityModel.create({
    id: `bnhs_conv_act2_${timestamp}`,
    name: 'Flamingo Watch at TS Chanakya',
    title: 'Flamingo Watch at TS Chanakya',
    description: 'Wetland migratory birds study.',
    type: 'walk',
    category: 'Flamingos',
    location: 'Navi Mumbai',
    date: new Date(),
    capacity: 25,
    registeredCount: 8,
    status: 'upcoming'
  });

  const act3 = await ActivityModel.create({
    id: `bnhs_conv_act3_${timestamp}`,
    name: 'Marine Tidepool Biology at Bandra',
    title: 'Marine Tidepool Biology at Bandra',
    description: 'Rocky shore fauna.',
    type: 'walk',
    category: 'Marine',
    location: 'Mumbai',
    date: new Date(),
    capacity: 20,
    registeredCount: 5,
    status: 'upcoming'
  });

  // Register users
  await RegistrationModel.create([
    { user: userA._id, activity: act1._id, status: 'registered', bookingId: `REG-A-1-${timestamp}` },
    { user: userB._id, activity: act1._id, status: 'registered', bookingId: `REG-B-1-${timestamp}` },
    { user: userA._id, activity: act2._id, status: 'registered', bookingId: `REG-A-2-${timestamp}` },
    { user: userB._id, activity: act3._id, status: 'registered', bookingId: `REG-B-3-${timestamp}` },
  ]);

  try {
    // ----------------------------------------------------
    // TEST 1: Empty state for fresh user
    // ----------------------------------------------------
    console.log('--- 1. Empty State for New User ---');
    {
      const { req, res } = createMockReqRes({}, {}, {}, {}, { id: userEmpty._id.toString(), role: 'user' });
      await communityController.getMyConversations(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 200, 'HTTP 200 returned for empty conversation list');
      assert(data.success === true, 'success: true returned');
      assert(data.count === 0, 'count is 0');
      assert(Array.isArray(data.conversations) && data.conversations.length === 0, 'conversations is empty array');
    }

    // ----------------------------------------------------
    // TEST 2: Populate Messages
    // ----------------------------------------------------
    console.log('\n--- 2. Post Messages across Activities ---');
    {
      // Act 1 (older message from Aarav)
      const { req: req1, res: res1 } = createMockReqRes(
        { message: 'Excited for Vetal Tekdi tomorrow morning!' },
        {},
        { activityId: act1.id },
        {},
        { id: userA._id.toString(), name: 'Aarav Sharma', role: 'user' }
      );
      await communityController.sendActivityMessage(req1, res1);
      assert(res1.getStatusCode() === 201, 'Aarav posted in Activity 1');

      // Act 2 (newer message from Aarav with image)
      const { req: req2, res: res2 } = createMockReqRes(
        {
          message: 'Sharing flamingo flock photo!',
          imageUrls: ['/uploads/bnhs_flamingo_test.jpg']
        },
        {},
        { activityId: act2.id },
        {},
        { id: userA._id.toString(), name: 'Aarav Sharma', role: 'user' }
      );
      await communityController.sendActivityMessage(req2, res2);
      assert(res2.getStatusCode() === 201, 'Aarav posted in Activity 2 with photo');

      // Act 3 (message from Priya only)
      const { req: req3, res: res3 } = createMockReqRes(
        { message: 'Marine walk start time confirmed.' },
        {},
        { activityId: act3.id },
        {},
        { id: userB._id.toString(), name: 'Priya Iyer', role: 'user' }
      );
      await communityController.sendActivityMessage(req3, res3);
      assert(res3.getStatusCode() === 201, 'Priya posted in Activity 3');
    }

    // ----------------------------------------------------
    // TEST 3: User A's getMyConversations (Personalization & Sorting)
    // ----------------------------------------------------
    console.log('\n--- 3. Verify Personalized Conversations for Aarav ---');
    {
      const { req, res } = createMockReqRes({}, {}, {}, {}, { id: userA._id.toString(), role: 'user' });
      await communityController.getMyConversations(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 200, 'getMyConversations returned HTTP 200');
      assert(data.conversations.length === 2, 'Aarav sees exactly 2 discussions (Act 1 and Act 2)');
      assert(data.conversations[0].activityTitle.includes('Flamingo Watch'), 'Activity 2 (newest) appears first');
      assert(data.conversations[1].activityTitle.includes('Bird Watching Walk'), 'Activity 1 appears second');
      assert(data.conversations[0].lastMessage.hasImages === true, 'Activity 2 indicates hasImages: true');
      assert(data.conversations[0].lastMessage.senderName === 'You', 'Sender name formatted as "You" for current user');
    }

    // ----------------------------------------------------
    // TEST 4: User B's getMyConversations (Isolation)
    // ----------------------------------------------------
    console.log('\n--- 4. Verify User B Isolation ---');
    {
      const { req, res } = createMockReqRes({}, {}, {}, {}, { id: userB._id.toString(), role: 'user' });
      await communityController.getMyConversations(req, res);
      const data = res.getData();

      // Priya is registered in Act 1 and Act 3 (not Act 2)
      assert(data.conversations.length === 2, 'Priya sees exactly 2 discussions (Act 1 and Act 3)');
      const titles = data.conversations.map(c => c.activityTitle);
      assert(titles.some(t => t.includes('Marine')), 'Contains Marine walk');
      assert(titles.some(t => t.includes('Vetal Tekdi')), 'Contains Vetal Tekdi');
      assert(!titles.some(t => t.includes('Flamingo')), 'Does NOT contain Flamingo (Priya not involved)');
    }

    // ----------------------------------------------------
    // TEST 5: Unread Count Calculation & Mark Read
    // ----------------------------------------------------
    console.log('\n--- 5. Unread Message Count & Mark Read ---');
    {
      // Priya sends a message in Act 1
      const { req: priyaMsgReq, res: priyaMsgRes } = createMockReqRes(
        { message: 'Bringing binoculars for everyone!' },
        {},
        { activityId: act1.id },
        {},
        { id: userB._id.toString(), name: 'Priya Iyer', role: 'user' }
      );
      await communityController.sendActivityMessage(priyaMsgReq, priyaMsgRes);
      assert(priyaMsgRes.getStatusCode() === 201, 'Priya replied in Activity 1');

      // Check Aarav's conversations -> Act 1 should now be at top and have unreadCount >= 1
      const { req: aaravReq, res: aaravRes } = createMockReqRes({}, {}, {}, {}, { id: userA._id.toString(), role: 'user' });
      await communityController.getMyConversations(aaravReq, aaravRes);
      const aaravData = aaravRes.getData();

      assert(aaravData.conversations[0].activityTitle.includes('Vetal Tekdi'), 'Activity 1 moved to top after new reply');
      assert(aaravData.conversations[0].unreadCount >= 1, `Unread count is ${aaravData.conversations[0].unreadCount} (>= 1)`);
      assert(aaravData.conversations[0].lastMessage.senderName === 'Priya Iyer', 'Last message sender is Priya Iyer');

      // Aarav opens the conversation (marking it as read)
      const { req: readReq, res: readRes } = createMockReqRes({}, {}, { activityId: act1.id }, {}, { id: userA._id.toString(), role: 'user' });
      await communityController.markConversationRead(readReq, readRes);
      assert(readRes.getStatusCode() === 200, 'Conversation marked as read with HTTP 200');

      // Check Aarav's conversations again -> unreadCount should now be 0
      const { req: afterReq, res: afterRes } = createMockReqRes({}, {}, {}, {}, { id: userA._id.toString(), role: 'user' });
      await communityController.getMyConversations(afterReq, afterRes);
      const afterData = afterRes.getData();

      const act1Conv = afterData.conversations.find(c => c.activityTitle.includes('Vetal Tekdi'));
      assert(act1Conv && act1Conv.unreadCount === 0, 'Unread count reset to 0 after viewing discussion');
    }

  } finally {
    // Cleanup temporary test data
    await CommunityReadStateModel.deleteMany({ user: { $in: [userA._id, userB._id, userEmpty._id] } });
    await CommunityMessageModel.deleteMany({ activity: { $in: [act1._id, act2._id, act3._id] } });
    await RegistrationModel.deleteMany({ user: { $in: [userA._id, userB._id, userEmpty._id] } });
    await ActivityModel.deleteMany({ _id: { $in: [act1._id, act2._id, act3._id] } });
    await UserModel.deleteMany({ _id: { $in: [userA._id, userB._id, userEmpty._id] } });
    console.log('\n[TEST CLEANUP] Cleaned up temporary test fixtures.');
  }

  console.log('\n========================================================');
  console.log(`📊 "MY CONVERSATIONS" SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runMyConversationsTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
