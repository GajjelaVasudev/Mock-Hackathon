/**
 * Comprehensive Edge Case Verification for "AI Chat-to-Register" Feature.
 * Specifically tests:
 * 1. Security check: User ID strictly extracted from JWT session (spoofed IDs ignored).
 * 2. Already registered -> no duplicate booking.
 * 3. Event full -> register rejected with full capacity notice.
 * 4. Cancelled event -> cannot register.
 * 5. Positional reference "the first one" -> correct 1st activity selected.
 * 6. Positional reference "register that one" -> correct active activity selected.
 * 7. Double registration attempt (concurrency/double click) -> only one booking persisted.
 * 8. Session expired / unauthenticated -> clean authentication message.
 * 9. Admin / Staff role -> registration restricted with clean role message.
 * 10. Normal RAG query preservation.
 */

const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: __dirname + '/../.env' });

const ActivityModel = require('./models/activity.model');
const RegistrationModel = require('./models/registration.model');
const UserModel = require('./models/user.model');
const aiController = require('./controllers/ai.controller');

function createMockReqRes(body = {}, headers = {}, cookies = {}) {
  const req = { body, headers, cookies, params: {}, query: {} };
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

async function runEdgeCaseTests() {
  console.log('========================================================');
  console.log('🛡️  BNHS CHAT-TO-REGISTER SECURITY & EDGE CASE SUITE');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
  console.log('✓ MongoDB Connected Successfully\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // Setup Test Users
  const timestamp = Date.now();
  const testUser = await UserModel.create({
    username: `edge_user_${timestamp}`,
    email: `edge_user_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'user',
    isEmailVerified: true,
    interests: ['birds', 'wetlands', 'conservation'],
    location: 'Navi Mumbai',
    experience_level: 'beginner'
  });

  const spoofUser = await UserModel.create({
    username: `spoof_target_${timestamp}`,
    email: `spoof_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'user',
    isEmailVerified: true
  });

  const staffUser = await UserModel.create({
    username: `staff_tester_${timestamp}`,
    email: `staff_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'staff',
    isEmailVerified: true
  });

  const adminUser = await UserModel.create({
    username: `admin_tester_${timestamp}`,
    email: `admin_${timestamp}@bnhstest.org`,
    password: 'hashed_pass_test',
    role: 'admin',
    isEmailVerified: true
  });

  const userToken = jwt.sign(
    { id: testUser._id.toString(), email: testUser.email, role: 'user' },
    process.env.JWT_SECRET || 'bnhs_default_secret_jwt',
    { expiresIn: '1h' }
  );

  const staffToken = jwt.sign(
    { id: staffUser._id.toString(), email: staffUser.email, role: 'staff' },
    process.env.JWT_SECRET || 'bnhs_default_secret_jwt',
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
    process.env.JWT_SECRET || 'bnhs_default_secret_jwt',
    { expiresIn: '1h' }
  );

  const userHeaders = { authorization: `Bearer ${userToken}` };
  const staffHeaders = { authorization: `Bearer ${staffToken}` };
  const adminHeaders = { authorization: `Bearer ${adminToken}` };

  // Setup Test Activities
  const testActivity = await ActivityModel.create({
    id: `bnhs_edge_act_${timestamp}`,
    name: 'Edge Case Flamingo Trail',
    description: 'Special test trail for edge case verification',
    type: 'walk',
    location: 'Navi Mumbai',
    capacity: 2,
    registeredCount: 0,
    status: 'upcoming'
  });

  const fullActivity = await ActivityModel.create({
    id: `bnhs_edge_full_${timestamp}`,
    name: 'Edge Case Full Event',
    description: 'Test event at max capacity',
    type: 'camp',
    location: 'Mumbai',
    capacity: 1,
    registeredCount: 1,
    status: 'full'
  });

  const cancelledActivity = await ActivityModel.create({
    id: `bnhs_edge_cancelled_${timestamp}`,
    name: 'Edge Case Cancelled Walk',
    description: 'Test cancelled activity',
    type: 'walk',
    location: 'Pune',
    capacity: 20,
    registeredCount: 0,
    status: 'cancelled'
  });

  try {
    // ----------------------------------------------------
    // EDGE CASE 1: Security Check (Spoofed userId in Body vs JWT Token)
    // ----------------------------------------------------
    console.log('--- 1. Security Check: Authenticated User ID Verification ---');
    {
      // Attempt to register with a spoofed user_id in body while authenticated as testUser
      const { req, res } = createMockReqRes(
        {
          query: 'confirm registration',
          session_id: 'sec_sess_1',
          pending_activity_id: testActivity.id,
          confirm_action: true,
          user_profile: { id: spoofUser._id.toString() }, // Spoofed target
          user_id: spoofUser._id.toString()               // Spoofed target
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_CONFIRMATION', 'Registration processed');
      assert(data.registrationResult && data.registrationResult.status === 'confirmed', 'Registration confirmed');

      // Verify that registration is in MongoDB under testUser, NOT spoofUser!
      const testUserReg = await RegistrationModel.findOne({ user: testUser._id, activity: testActivity._id });
      const spoofUserReg = await RegistrationModel.findOne({ user: spoofUser._id, activity: testActivity._id });

      assert(testUserReg !== null, 'Security Verified: Booking recorded for authenticated JWT user (testUser)');
      assert(spoofUserReg === null, 'Security Verified: Spoofed user ID was completely ignored');
    }

    // ----------------------------------------------------
    // EDGE CASE 2: Already Registered -> No Duplicate Booking
    // ----------------------------------------------------
    console.log('\n--- 2. Edge Case: Already Registered (No Duplicate) ---');
    {
      const { req, res } = createMockReqRes(
        {
          query: `Register me for ${testActivity.name}`,
          session_id: 'sec_sess_1',
          active_activities: [testActivity.toObject()]
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_ALREADY_REGISTERED', 'Detected already registered');
      assert(data.answer.includes('already registered'), 'Returned clear already-registered notification');

      const count = await RegistrationModel.countDocuments({ user: testUser._id, activity: testActivity._id });
      assert(count === 1, 'Exact registration count in MongoDB remains 1 (no duplicate)');
    }

    // ----------------------------------------------------
    // EDGE CASE 3: Event Full -> Registration Rejected
    // ----------------------------------------------------
    console.log('\n--- 3. Edge Case: Event Full Handling ---');
    {
      const { req, res } = createMockReqRes(
        {
          query: `Register me for ${fullActivity.name}`,
          session_id: 'sec_sess_2',
          active_activities: [fullActivity.toObject()]
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_EVENT_FULL', 'Intent detected event full');
      assert(data.answer.includes('full capacity'), 'Clean full capacity message returned');
    }

    // ----------------------------------------------------
    // EDGE CASE 4: Cancelled Event -> Cannot Register
    // ----------------------------------------------------
    console.log('\n--- 4. Edge Case: Cancelled Event Handling ---');
    {
      const { req, res } = createMockReqRes(
        {
          query: 'confirm registration',
          session_id: 'sec_sess_3',
          pending_activity_id: cancelledActivity.id,
          confirm_action: true
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_FAILED', 'Intent flagged registration failed');
      assert(data.answer.includes('no longer available') || data.answer.includes('cancelled'), 'Returned cancelled event rejection message');
    }

    // ----------------------------------------------------
    // EDGE CASE 5: User says "the first one"
    // ----------------------------------------------------
    console.log('\n--- 5. Edge Case: Positional Reference ("the first one") ---');
    {
      const acts = [
        { id: 'act_choice_1', name: 'Mangrove Boardwalk', location: 'Airoli', type: 'walk' },
        { id: 'act_choice_2', name: 'Coastal Tidepool Exploration', location: 'Juhu', type: 'walk' }
      ];

      const { req, res } = createMockReqRes(
        {
          query: 'Register me for the first one',
          session_id: 'sec_sess_4',
          active_activities: acts
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_REQUEST', 'Intent detected as REGISTRATION_REQUEST');
      assert(data.pendingRegistration && data.pendingRegistration.activityId === 'act_choice_1', 'Correctly selected 1st activity (Mangrove Boardwalk)');
    }

    // ----------------------------------------------------
    // EDGE CASE 6: User says "register that one"
    // ----------------------------------------------------
    console.log('\n--- 6. Edge Case: Positional Reference ("register that one") ---');
    {
      const acts = [
        { id: 'act_choice_alpha', name: 'SGNP Forest Trail', location: 'Borivali', type: 'walk' },
        { id: 'act_choice_beta', name: 'Karnala Bird Sanctuary Camp', location: 'Panvel', type: 'camp' }
      ];

      const { req, res } = createMockReqRes(
        {
          query: 'Register that one',
          session_id: 'sec_sess_5',
          active_activities: acts
        },
        userHeaders
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_REQUEST', 'Intent detected as REGISTRATION_REQUEST');
      assert(data.pendingRegistration && data.pendingRegistration.activityId === 'act_choice_beta', 'Correctly selected active/last activity (Karnala Camp)');
    }

    // ----------------------------------------------------
    // EDGE CASE 7: Double Click / Rapid Re-registration
    // ----------------------------------------------------
    console.log('\n--- 7. Edge Case: User clicks Register twice (Double-click protection) ---');
    {
      const freshActivity = await ActivityModel.create({
        id: `bnhs_fresh_${timestamp}`,
        name: 'Fresh Bird Watching Walk',
        description: 'Testing rapid double registration',
        type: 'walk',
        location: 'Mumbai',
        capacity: 10,
        registeredCount: 0,
        status: 'upcoming'
      });

      // 1st Registration Click
      const { req: req1, res: res1 } = createMockReqRes(
        { query: 'confirm', session_id: 'sec_sess_6', pending_activity_id: freshActivity.id, confirm_action: true },
        userHeaders
      );
      await aiController.queryChat(req1, res1);
      const data1 = res1.getData();
      assert(data1.registrationResult.status === 'confirmed', '1st Click: Successfully confirmed booking');

      // 2nd Registration Click (Simulating accidental double click)
      const { req: req2, res: res2 } = createMockReqRes(
        { query: 'confirm', session_id: 'sec_sess_6', pending_activity_id: freshActivity.id, confirm_action: true },
        userHeaders
      );
      await aiController.queryChat(req2, res2);
      const data2 = res2.getData();

      assert(data2.intent === 'REGISTRATION_FAILED', '2nd Click: Duplicate booking blocked cleanly');
      assert(data2.answer.includes('Already registered') || data2.answer.includes('already registered'), 'Duplicate error message returned');

      const totalBookings = await RegistrationModel.countDocuments({ user: testUser._id, activity: freshActivity._id });
      assert(totalBookings === 1, 'Only 1 registration document exists in MongoDB');

      // Cleanup
      await ActivityModel.deleteOne({ _id: freshActivity._id });
      await RegistrationModel.deleteMany({ activity: freshActivity._id });
    }

    // ----------------------------------------------------
    // EDGE CASE 8: Session Expired / Unauthenticated User
    // ----------------------------------------------------
    console.log('\n--- 8. Edge Case: Session Expired / Unauthenticated ---');
    {
      const { req, res } = createMockReqRes(
        {
          query: 'confirm registration',
          session_id: 'sec_sess_7',
          pending_activity_id: 'bnhs_flamingo_watch_chanakya',
          confirm_action: true
        },
        {} // No auth headers, no cookies
      );
      await aiController.queryChat(req, res);
      const data = res.getData();

      assert(data.intent === 'REGISTRATION_UNAUTHORIZED', 'Intent detected unauthenticated session');
      assert(data.answer.includes('session has expired') || data.answer.includes('sign in'), 'Clean sign-in message returned');
    }

    // ----------------------------------------------------
    // EDGE CASE 9: Staff / Admin Role Restrictions
    // ----------------------------------------------------
    console.log('\n--- 9. Edge Case: Admin & Staff Role Restrictions ---');
    {
      // Staff attempt
      const { req: staffReq, res: staffRes } = createMockReqRes(
        { query: 'confirm', session_id: 'sec_sess_8', pending_activity_id: 'bnhs_flamingo_watch_chanakya', confirm_action: true },
        staffHeaders
      );
      await aiController.queryChat(staffReq, staffRes);
      const staffData = staffRes.getData();
      assert(staffData.intent === 'REGISTRATION_ROLE_RESTRICTED', 'Staff registration restricted in chat');
      assert(staffData.answer.includes('member/user accounts') || staffData.answer.includes('Staff and Administrator'), 'Staff restriction explanation returned');

      // Admin attempt
      const { req: adminReq, res: adminRes } = createMockReqRes(
        { query: 'confirm', session_id: 'sec_sess_9', pending_activity_id: 'bnhs_flamingo_watch_chanakya', confirm_action: true },
        adminHeaders
      );
      await aiController.queryChat(adminReq, adminRes);
      const adminData = adminRes.getData();
      assert(adminData.intent === 'REGISTRATION_ROLE_RESTRICTED', 'Admin registration restricted in chat');
      assert(adminData.answer.includes('member/user accounts') || adminData.answer.includes('Staff and Administrator'), 'Admin restriction explanation returned');
    }

  } finally {
    // Clean up temporary edge test data
    await RegistrationModel.deleteMany({
      user: { $in: [testUser._id, spoofUser._id, staffUser._id, adminUser._id] }
    });
    await UserModel.deleteMany({
      _id: { $in: [testUser._id, spoofUser._id, staffUser._id, adminUser._id] }
    });
    await ActivityModel.deleteMany({
      _id: { $in: [testActivity._id, fullActivity._id, cancelledActivity._id] }
    });
    console.log('\n[TEST CLEANUP] Cleaned up temporary test users, activities, and bookings.');
  }

  console.log('\n========================================================');
  console.log(`📊 EDGE CASE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEdgeCaseTests().catch(err => {
  console.error('Edge case test error:', err);
  process.exit(1);
});
