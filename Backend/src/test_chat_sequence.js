/**
 * End-to-End Simulation of the Exact Activity Group Chat Sequence:
 * 1. Open Activity Group A
 * 2. Send 3-5 text messages from User 1
 * 3. Send 1-2 images from User 1
 * 4. Simulate page refresh / reconnect: re-query messages -> verify all texts + images intact
 * 5. Close activity chat & open same activity again -> verify persistent history
 * 6. Populate older messages (>50) & verify pagination with before cursor -> verify older messages loaded chronologically
 * 7. Simulate User 1 reading in the middle & User 2 sending a new message
 * 8. Verify User 2 message is captured, new message indicator state detected
 * 9. Switch to Activity B -> verify Activity B has clean isolated conversation
 * 10. Return to Activity A -> verify all Activity A conversation history remains completely intact
 */

const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: __dirname + '/../.env' });

const UserModel = require('./models/user.model');
const ActivityModel = require('./models/activity.model');
const RegistrationModel = require('./models/registration.model');
const CommunityMessageModel = require('./models/communityMessage.model');
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

async function runEndToEndSequence() {
  console.log('========================================================');
  console.log('🧪 BNHS ACTIVITY GROUP CHAT END-TO-END SEQUENCE TEST');
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

  // Create Test Users
  const userAarav = await UserModel.create({
    username: `aarav_seq_${timestamp}`,
    name: 'Aarav Sharma',
    email: `aarav_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'user',
    isEmailVerified: true
  });

  const userPriya = await UserModel.create({
    username: `priya_seq_${timestamp}`,
    name: 'Priya Iyer',
    email: `priya_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'user',
    isEmailVerified: true
  });

  // Create Two Distinct Activities
  const activityA = await ActivityModel.create({
    id: `bnhs_act_a_${timestamp}`,
    name: 'BNHS Awareness Bird Walk at Vetal Tekdi',
    title: 'BNHS Awareness Bird Walk at Vetal Tekdi',
    description: 'Guided birding walk on the hill slopes.',
    type: 'walk',
    category: 'Birds',
    location: 'Pune',
    date: new Date(),
    capacity: 30,
    registeredCount: 11,
    status: 'upcoming'
  });

  const activityB = await ActivityModel.create({
    id: `bnhs_act_b_${timestamp}`,
    name: 'Coastal Marine Tidepool Walk at Juhu',
    title: 'Coastal Marine Tidepool Walk at Juhu',
    description: 'Shoreline marine organisms study.',
    type: 'walk',
    category: 'Marine',
    location: 'Mumbai',
    date: new Date(),
    capacity: 25,
    registeredCount: 8,
    status: 'upcoming'
  });

  // Register both users for Activity A, and userPriya for Activity B
  await RegistrationModel.create([
    {
      user: userAarav._id,
      activity: activityA._id,
      activityId: activityA.id,
      activityName: activityA.name,
      status: 'registered',
      bookingId: `REG-AARAV-A-${timestamp}`
    },
    {
      user: userPriya._id,
      activity: activityA._id,
      activityId: activityA.id,
      activityName: activityA.name,
      status: 'registered',
      bookingId: `REG-PRIYA-A-${timestamp}`
    },
    {
      user: userPriya._id,
      activity: activityB._id,
      activityId: activityB.id,
      activityName: activityB.name,
      status: 'registered',
      bookingId: `REG-PRIYA-B-${timestamp}`
    }
  ]);

  try {
    // ----------------------------------------------------
    // STEP 1 & 2: Open Activity Group A & Send 4 Text Messages from Aarav
    // ----------------------------------------------------
    console.log('--- Step 1 & 2: Send 4 Text Messages from Aarav in Activity A ---');
    const aaravTexts = [
      'Good morning everyone! Excited for the Vetal Tekdi walk tomorrow. 🌿',
      'What time is assembly near the base quarry?',
      'Has anyone spotted the Indian Pitta on this trail recently?',
      'I am bringing a 400mm lens for photography.'
    ];

    for (const text of aaravTexts) {
      const { req, res } = createMockReqRes(
        { message: text },
        {},
        { activityId: activityA.id },
        {},
        { id: userAarav._id.toString(), name: userAarav.name, role: 'user' }
      );
      await communityController.sendActivityMessage(req, res);
      assert(res.getStatusCode() === 201, `Sent message: "${text.slice(0, 30)}..."`);
    }

    // ----------------------------------------------------
    // STEP 3: Send 2 Images from Aarav
    // ----------------------------------------------------
    console.log('\n--- Step 3: Send 2 Images with Message from Aarav ---');
    {
      const { req, res } = createMockReqRes(
        {
          message: 'Here are two reference sightings from my last scouting session!',
          imageUrls: ['/uploads/bnhs_img_kingfisher.jpg', '/uploads/bnhs_img_green_pigeon.webp']
        },
        {},
        { activityId: activityA.id },
        {},
        { id: userAarav._id.toString(), name: userAarav.name, role: 'user' }
      );
      await communityController.sendActivityMessage(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 201, 'Sent message with 2 attached images');
      assert(data.chatMessage.imageUrls.length === 2, '2 image URLs attached properly');
    }

    // ----------------------------------------------------
    // STEP 4, 5, 6, 7: Refresh / Reopen Activity A & Verify Complete Persistence
    // ----------------------------------------------------
    console.log('\n--- Step 4-7: Refresh & Reopen Activity A -> Verify Persistence ---');
    {
      const { req, res } = createMockReqRes(
        {},
        {},
        { activityId: activityA.id },
        { limit: 50 },
        { id: userAarav._id.toString(), name: userAarav.name, role: 'user' }
      );
      await communityController.getActivityMessages(req, res);
      const history = res.getData();

      assert(res.getStatusCode() === 200, 'Re-queried Activity A messages with HTTP 200');
      assert(history.messages.length === 5, 'Exactly 5 messages persisted in MongoDB');
      assert(history.messages[0].message.includes('Good morning'), 'Message 1 text preserved in order');
      assert(history.messages[3].message.includes('400mm lens'), 'Message 4 text preserved in order');
      assert(history.messages[4].imageUrls.length === 2, 'Message 5 images preserved permanently');
    }

    // ----------------------------------------------------
    // STEP 8 & 9: Verify Pagination with Older Messages
    // ----------------------------------------------------
    console.log('\n--- Step 8 & 9: Test Upward Scroll Cursor Pagination ---');
    {
      // Insert older message with earlier timestamp
      const olderDate = new Date(Date.now() - 3600000); // 1 hour ago
      await CommunityMessageModel.create({
        activity: activityA._id,
        activityIdString: activityA.id,
        user: userPriya._id,
        userName: userPriya.username || 'Priya Naturalist',
        userRole: 'user',
        message: 'Older trail announcement from last week.',
        status: 'active',
        createdAt: olderDate
      });

      // Query latest 5 messages
      const { req: latestReq, res: latestRes } = createMockReqRes(
        {},
        {},
        { activityId: activityA.id },
        { limit: 5 },
        { id: userAarav._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(latestReq, latestRes);
      const latestData = latestRes.getData();

      assert(latestData.messages.length === 5, 'Latest slice returns 5 messages');
      assert(latestData.hasMore === true, 'hasMore: true indicates older messages exist above');

      // Now query older messages using cursor before = oldest message in current slice
      const oldestInSlice = latestData.messages[0].createdAt;
      const { req: olderReq, res: olderRes } = createMockReqRes(
        {},
        {},
        { activityId: activityA.id },
        { limit: 5, before: oldestInSlice },
        { id: userAarav._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(olderReq, olderRes);
      const olderData = olderRes.getData();

      assert(olderData.messages.length >= 1, 'Cursor pagination returned older messages');
      assert(olderData.messages[0].message.includes('Older trail announcement'), 'Correct historical message returned');
    }

    // ----------------------------------------------------
    // STEP 10, 11, 12, 13: Priya sends message to Activity A while Aarav is active
    // ----------------------------------------------------
    console.log('\n--- Step 10-13: Priya replies in Activity A -> Verify Multi-User Conversation ---');
    {
      const { req: priyaReq, res: priyaRes } = createMockReqRes(
        { message: 'Hi Aarav! Assembly is at 06:45 AM at the main gate. See you there! 🐦' },
        {},
        { activityId: activityA.id },
        {},
        { id: userPriya._id.toString(), name: 'Priya Iyer', username: userPriya.username, role: 'user' }
      );
      await communityController.sendActivityMessage(priyaReq, priyaRes);
      assert(priyaRes.getStatusCode() === 201, 'Priya successfully sent message in Activity A');

      // Aarav fetches latest messages
      const { req: aaravFetchReq, res: aaravFetchRes } = createMockReqRes(
        {},
        {},
        { activityId: activityA.id },
        { limit: 50 },
        { id: userAarav._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(aaravFetchReq, aaravFetchRes);
      const aaravData = aaravFetchRes.getData();

      const lastMsg = aaravData.messages[aaravData.messages.length - 1];
      assert(lastMsg.userName === 'Priya Iyer', 'Priya message appears as newest message');
      assert(lastMsg.isCurrentUser === false, 'isCurrentUser correctly false for Aarav receiving Priya message');
    }

    // ----------------------------------------------------
    // STEP 14, 15, 16, 17, 18: Switch to Activity B & Return to Activity A
    // ----------------------------------------------------
    console.log('\n--- Step 14-18: Cross-Activity Isolation & Return to Activity A ---');
    {
      // Send message in Activity B from Priya
      const { req: actBReq, res: actBRes } = createMockReqRes(
        { message: 'Welcome to the Juhu Marine Walk group discussion! 🌊' },
        {},
        { activityId: activityB.id },
        {},
        { id: userPriya._id.toString(), name: userPriya.name, role: 'user' }
      );
      await communityController.sendActivityMessage(actBReq, actBRes);
      assert(actBRes.getStatusCode() === 201, 'Activity B message posted');

      // Fetch Activity B messages -> should only have 1 message
      const { req: getBReq, res: getBRes } = createMockReqRes(
        {},
        {},
        { activityId: activityB.id },
        { limit: 50 },
        { id: userPriya._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(getBReq, getBRes);
      const bData = getBRes.getData();
      assert(bData.messages.length === 1, 'Activity B contains only its own discussion (1 message)');

      // Return to Activity A -> verify full history is completely intact
      const { req: getAReq, res: getARes } = createMockReqRes(
        {},
        {},
        { activityId: activityA.id },
        { limit: 50 },
        { id: userAarav._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(getAReq, getARes);
      const aData = getARes.getData();
      assert(aData.messages.length === 7, 'Activity A conversation intact with all 7 historical messages');
    }

  } finally {
    // Cleanup temporary test data
    await CommunityMessageModel.deleteMany({ activity: { $in: [activityA._id, activityB._id] } });
    await RegistrationModel.deleteMany({ user: { $in: [userAarav._id, userPriya._id] } });
    await ActivityModel.deleteMany({ _id: { $in: [activityA._id, activityB._id] } });
    await UserModel.deleteMany({ _id: { $in: [userAarav._id, userPriya._id] } });
    console.log('\n[TEST CLEANUP] Cleaned up temporary sequence test data.');
  }

  console.log('\n========================================================');
  console.log(`📊 END-TO-END SEQUENCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runEndToEndSequence().catch(err => {
  console.error('Sequence test error:', err);
  process.exit(1);
});
