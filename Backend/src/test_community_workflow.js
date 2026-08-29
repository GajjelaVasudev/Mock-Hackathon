/**
 * Automated Verification Suite for BNHS Community Experience & Group Chat.
 * Verifies:
 * 1. Community feed with category filtering & sorting.
 * 2. Attended activities listing for verified experience sharing.
 * 3. Creating experience post for attended activity (allowed).
 * 4. Security Check: Rejecting experience post for non-attended activity (403 Forbidden).
 * 5. Experience post reactions and duplicate reaction prevention.
 * 6. Experience post comments and threaded replies.
 * 7. Activity group chat info and access permission gating.
 * 8. Sending and retrieving group chat messages.
 * 9. Content reporting by members.
 * 10. Admin moderation dashboard (reviewing and resolving reports).
 * 11. Security Check: Non-admin denied moderation actions (403 Forbidden).
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
const ExperiencePostModel = require('./models/experiencePost.model');
const CommunityMessageModel = require('./models/communityMessage.model');
const CommunityReportModel = require('./models/communityReport.model');
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

async function runCommunityTests() {
  console.log('========================================================');
  console.log('🌿 BNHS COMMUNITY & GROUP CHAT AUTOMATED VERIFICATION');
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

  const timestamp = Date.now();

  // 1. Setup Test Users
  const memberUser = await UserModel.create({
    username: `comm_member_${timestamp}`,
    name: 'Aarav Community Member',
    email: `comm_member_${timestamp}@bnhs.org`,
    password: 'hashed_test_password',
    role: 'user',
    isEmailVerified: true,
    interests: ['birds', 'wetlands', 'nature photography']
  });

  const otherMember = await UserModel.create({
    username: `other_member_${timestamp}`,
    name: 'Priya Naturalist',
    email: `other_member_${timestamp}@bnhs.org`,
    password: 'hashed_test_password',
    role: 'user',
    isEmailVerified: true
  });

  const staffUser = await UserModel.create({
    username: `comm_staff_${timestamp}`,
    name: 'Rohan Staff Leader',
    email: `comm_staff_${timestamp}@bnhs.org`,
    password: 'hashed_test_password',
    role: 'staff',
    isEmailVerified: true
  });

  const adminUser = await UserModel.create({
    username: `comm_admin_${timestamp}`,
    name: 'Admin Moderator',
    email: `comm_admin_${timestamp}@bnhs.org`,
    password: 'hashed_test_password',
    role: 'admin',
    isEmailVerified: true
  });

  // 2. Setup Test Activities
  const attendedActivity = await ActivityModel.create({
    id: `bnhs_comm_attended_${timestamp}`,
    name: 'Vetal Tekdi Bird Walk',
    title: 'Vetal Tekdi Bird Walk',
    description: 'Guided morning bird observation trail.',
    type: 'walk',
    category: 'Birds',
    location: 'Pune',
    date: new Date(),
    capacity: 25,
    registeredCount: 15,
    status: 'completed'
  });

  const nonAttendedActivity = await ActivityModel.create({
    id: `bnhs_comm_unattended_${timestamp}`,
    name: 'Marine Walk at Juhu',
    title: 'Marine Walk at Juhu',
    description: 'Shoreline marine life exploration.',
    type: 'walk',
    category: 'Marine',
    location: 'Mumbai',
    date: new Date(),
    capacity: 20,
    registeredCount: 5,
    status: 'upcoming'
  });

  // 3. Create Real Attended Registration for memberUser
  await RegistrationModel.create({
    user: memberUser._id,
    activity: attendedActivity._id,
    activityId: attendedActivity.id,
    activityName: attendedActivity.name,
    status: 'attended',
    bookingId: `REG-BNHS-ATT-${timestamp}`
  });

  // Also register otherMember for upcoming nonAttendedActivity
  await RegistrationModel.create({
    user: otherMember._id,
    activity: nonAttendedActivity._id,
    activityId: nonAttendedActivity.id,
    activityName: nonAttendedActivity.name,
    status: 'registered',
    bookingId: `REG-BNHS-REG-${timestamp}`
  });

  let createdPostId = null;
  let createdReportId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Attended Activities Endpoint
    // ----------------------------------------------------
    console.log('--- 1. Attended Activities for Experience Sharing ---');
    {
      const { req, res } = createMockReqRes({}, {}, {}, {}, { id: memberUser._id.toString(), role: 'user' });
      await communityController.getAttendedActivities(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 200, 'Attended activities retrieved with HTTP 200');
      assert(Array.isArray(data.activities), 'Returns array of attended activities');
      assert(data.activities.some(a => a.id === attendedActivity.id), 'Contains attended Vetal Tekdi Bird Walk');
      assert(!data.activities.some(a => a.id === nonAttendedActivity.id), 'Does NOT contain unattended Marine Walk');
    }

    // ----------------------------------------------------
    // TEST 2: Security Check - Create Post for Non-Attended Activity (Must Fail)
    // ----------------------------------------------------
    console.log('\n--- 2. Security: Prevent Experience Post on Unattended Activity ---');
    {
      const { req, res } = createMockReqRes(
        {
          activityId: nonAttendedActivity.id,
          content: 'Faking attendance for marine walk'
        },
        {},
        {},
        {},
        { id: memberUser._id.toString(), role: 'user', name: memberUser.name }
      );
      await communityController.createExperiencePost(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 403, 'HTTP 403 Forbidden returned for unattended activity');
      assert(data.message.includes('only share experiences for activities you have actually attended'), 'Returned clear attendance verification message');
    }

    // ----------------------------------------------------
    // TEST 3: Create Experience Post for Attended Activity (Must Succeed)
    // ----------------------------------------------------
    console.log('\n--- 3. Create Experience Post for Verified Attended Activity ---');
    {
      const { req, res } = createMockReqRes(
        {
          activityId: attendedActivity.id,
          content: 'Amazing birding morning at Vetal Tekdi! Spotted a white-throated kingfisher and yellow-footed green pigeons. 🐦🌿',
          imageUrls: ['/uploads/bnhs_test_photo_1.jpg', '/uploads/bnhs_test_photo_2.jpg']
        },
        {},
        {},
        {},
        { id: memberUser._id.toString(), role: 'user', name: memberUser.name }
      );
      await communityController.createExperiencePost(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 201, 'Post created with HTTP 201');
      assert(data.post && data.post.isAttendedVerified === true, 'Post has isAttendedVerified: true badge');
      assert(data.post.imageUrls.length === 2, 'Photographs successfully attached');
      assert(data.post.activityName === 'Vetal Tekdi Bird Walk', 'Correctly linked to real MongoDB activity');

      createdPostId = data.post._id.toString();
    }

    // ----------------------------------------------------
    // TEST 4: Community Feed Retrieval & Filtering
    // ----------------------------------------------------
    console.log('\n--- 4. Community Feed Retrieval & Filters ---');
    {
      const { req, res } = createMockReqRes({}, {}, {}, { category: 'bird', sort: 'recent' }, { id: otherMember._id.toString(), role: 'user' });
      await communityController.getFeed(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 200, 'Feed retrieved with HTTP 200');
      assert(data.posts.length >= 1, 'Contains published post in bird category');
      assert(data.posts.some(p => p._id.toString() === createdPostId), 'Published post is present in the feed');
    }

    // ----------------------------------------------------
    // TEST 5: Reactions (Like / Toggle / Duplicate Prevention)
    // ----------------------------------------------------
    console.log('\n--- 5. Post Reactions & Toggle ---');
    {
      // 1st Reaction (Like)
      const { req: req1, res: res1 } = createMockReqRes({ type: 'like' }, {}, { id: createdPostId }, {}, { id: otherMember._id.toString(), role: 'user' });
      await communityController.toggleReaction(req1, res1);
      const data1 = res1.getData();

      assert(data1.isLiked === true, 'Reaction added (isLiked: true)');
      assert(data1.reactionsCount === 1, 'reactionsCount incremented to 1');

      // 2nd Toggle (Un-like)
      const { req: req2, res: res2 } = createMockReqRes({ type: 'like' }, {}, { id: createdPostId }, {}, { id: otherMember._id.toString(), role: 'user' });
      await communityController.toggleReaction(req2, res2);
      const data2 = res2.getData();

      assert(data2.isLiked === false, 'Reaction toggled off (isLiked: false)');
      assert(data2.reactionsCount === 0, 'reactionsCount decremented to 0');

      // Add like back for subsequent tests
      await communityController.toggleReaction(req1, res1);
    }

    // ----------------------------------------------------
    // TEST 6: Comments on Experience Post
    // ----------------------------------------------------
    console.log('\n--- 6. Comments on Experience Post ---');
    {
      const { req, res } = createMockReqRes(
        { content: 'Did you spot any owls near the quarry area?' },
        {},
        { id: createdPostId },
        {},
        { id: otherMember._id.toString(), role: 'user', name: otherMember.name }
      );
      await communityController.addComment(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 201, 'Comment added with HTTP 201');
      assert(data.comment.content.includes('owls'), 'Comment text saved accurately');
      assert(data.commentsCount === 1, 'commentsCount is now 1');
    }

    // ----------------------------------------------------
    // TEST 7: Activity Group Chat Access & Permissions
    // ----------------------------------------------------
    console.log('\n--- 7. Activity Group Chat Permission Gating ---');
    {
      // A. Unregistered member trying to fetch chat messages for nonAttendedActivity (memberUser not registered)
      const { req: deniedReq, res: deniedRes } = createMockReqRes(
        {},
        {},
        { activityId: nonAttendedActivity.id },
        {},
        { id: memberUser._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(deniedReq, deniedRes);
      assert(deniedRes.getStatusCode() === 403, 'Unregistered user denied chat access (HTTP 403)');

      // B. Registered member fetching chat messages (otherMember is registered for nonAttendedActivity)
      const { req: allowedReq, res: allowedRes } = createMockReqRes(
        {},
        {},
        { activityId: nonAttendedActivity.id },
        {},
        { id: otherMember._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(allowedReq, allowedRes);
      assert(allowedRes.getStatusCode() === 200, 'Registered user granted chat access (HTTP 200)');

      // C. Staff member granted chat access
      const { req: staffReq, res: staffRes } = createMockReqRes(
        {},
        {},
        { activityId: nonAttendedActivity.id },
        {},
        { id: staffUser._id.toString(), role: 'staff' }
      );
      await communityController.getActivityMessages(staffReq, staffRes);
      assert(staffRes.getStatusCode() === 200, 'Staff member granted chat access (HTTP 200)');
    }

    // ----------------------------------------------------
    // TEST 8: Send Message to Activity Group Chat & Image Attachment
    // ----------------------------------------------------
    console.log('\n--- 8. Sending Activity Group Chat Messages & Image Persistence ---');
    {
      // Message 1: Text from staff
      const { req: msgReq1, res: msgRes1 } = createMockReqRes(
        { message: 'Welcome everyone to the Marine Walk! Remember to bring non-slip footwear. 🌊' },
        {},
        { activityId: nonAttendedActivity.id },
        {},
        { id: staffUser._id.toString(), role: 'staff', name: staffUser.name }
      );
      await communityController.sendActivityMessage(msgReq1, msgRes1);
      const data1 = msgRes1.getData();

      assert(msgRes1.getStatusCode() === 201, 'Message 1 sent with HTTP 201');
      assert(data1.chatMessage && data1.chatMessage.userRole === 'staff', 'Message recorded with staff role');
      assert(data1.chatMessage.message.includes('non-slip footwear'), 'Message text preserved');

      // Message 2: Reply with photograph attachment from registered participant
      const { req: msgReq2, res: msgRes2 } = createMockReqRes(
        {
          message: 'Got it! Spotted this hermit crab along the rocks earlier today.',
          imageUrls: ['/uploads/bnhs_test_crab.jpg']
        },
        {},
        { activityId: nonAttendedActivity.id },
        {},
        { id: otherMember._id.toString(), role: 'user', name: otherMember.name }
      );
      await communityController.sendActivityMessage(msgReq2, msgRes2);
      const data2 = msgRes2.getData();

      assert(msgRes2.getStatusCode() === 201, 'Message 2 with image sent with HTTP 201');
      assert(data2.chatMessage.imageUrls.length === 1, 'Image URL attached to message');

      // Reopening activity discussion -> Verifying complete conversation history is retrieved
      const { req: reopenReq, res: reopenRes } = createMockReqRes(
        {},
        {},
        { activityId: nonAttendedActivity.id },
        { limit: 10 },
        { id: otherMember._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(reopenReq, reopenRes);
      const historyData = reopenRes.getData();

      assert(reopenRes.getStatusCode() === 200, 'Reopened discussion returned HTTP 200');
      assert(historyData.messages.length === 2, 'All 2 persisted messages returned upon reopening');
      assert(historyData.messages[0].message.includes('non-slip footwear'), 'Message 1 persisted chronologically');
      assert(historyData.messages[1].imageUrls[0] === '/uploads/bnhs_test_crab.jpg', 'Image attachment persisted permanently');

      // Test cursor pagination with limit 1
      const { req: pageReq, res: pageRes } = createMockReqRes(
        {},
        {},
        { activityId: nonAttendedActivity.id },
        { limit: 1 },
        { id: otherMember._id.toString(), role: 'user' }
      );
      await communityController.getActivityMessages(pageReq, pageRes);
      const pageData = pageRes.getData();

      assert(pageData.messages.length === 1, 'Paginated query returned requested limit (1 message)');
      assert(pageData.hasMore === true, 'Pagination correctly flagged hasMore: true for older messages');
    }

    // ----------------------------------------------------
    // TEST 9: Content Reporting
    // ----------------------------------------------------
    console.log('\n--- 9. Content Reporting ---');
    {
      const { req, res } = createMockReqRes(
        {
          targetType: 'post',
          targetId: createdPostId,
          postId: createdPostId,
          reason: 'Misleading information',
          details: 'Verification of location details'
        },
        {},
        {},
        {},
        { id: otherMember._id.toString(), role: 'user', name: otherMember.name }
      );
      await communityController.createReport(req, res);
      const data = res.getData();

      assert(res.getStatusCode() === 201, 'Report created with HTTP 201');
      assert(data.reportId !== undefined, 'Report ID returned');

      createdReportId = data.reportId.toString();
    }

    // ----------------------------------------------------
    // TEST 10: Admin Moderation Panel (Admin Only)
    // ----------------------------------------------------
    console.log('\n--- 10. Admin Moderation & Security ---');
    {
      // A. Non-admin accessing admin reports (Must be 403)
      const { req: nonAdminReq, res: nonAdminRes } = createMockReqRes({}, {}, {}, {}, { id: memberUser._id.toString(), role: 'user' });
      await communityController.getAdminReports(nonAdminReq, nonAdminRes);
      assert(nonAdminRes.getStatusCode() === 403, 'Normal user blocked from admin reports (HTTP 403)');

      // B. Admin accessing reports (Must be 200)
      const { req: adminReq, res: adminRes } = createMockReqRes({}, {}, {}, { status: 'pending' }, { id: adminUser._id.toString(), role: 'admin' });
      await communityController.getAdminReports(adminReq, adminRes);
      const adminData = adminRes.getData();
      assert(adminRes.getStatusCode() === 200, 'Admin can view reported content (HTTP 200)');
      assert(adminData.reports.some(r => r._id.toString() === createdReportId), 'Contains newly filed report');

      // C. Admin Resolving Report (Dismiss)
      const { req: resolveReq, res: resolveRes } = createMockReqRes(
        { action: 'dismiss', adminNotes: 'Verified content is accurate and follows guidelines.' },
        {},
        { id: createdReportId },
        {},
        { id: adminUser._id.toString(), role: 'admin' }
      );
      await communityController.resolveReport(resolveReq, resolveRes);
      const resolveData = resolveRes.getData();
      assert(resolveRes.getStatusCode() === 200, 'Admin resolved report with HTTP 200');
      assert(resolveData.report.status === 'dismissed', 'Report status updated to dismissed');
    }

    // ----------------------------------------------------
    // TEST 11: Delete Experience Post (Owner vs Other)
    // ----------------------------------------------------
    console.log('\n--- 11. Delete Experience Post Permissions ---');
    {
      // Unauthorized deletion attempt (otherMember trying to delete memberUser's post)
      const { req: unauthReq, res: unauthRes } = createMockReqRes({}, {}, { id: createdPostId }, {}, { id: otherMember._id.toString(), role: 'user' });
      await communityController.deleteExperiencePost(unauthReq, unauthRes);
      assert(unauthRes.getStatusCode() === 403, 'Non-owner blocked from deleting post (HTTP 403)');

      // Owner deleting own post
      const { req: ownerReq, res: ownerRes } = createMockReqRes({}, {}, { id: createdPostId }, {}, { id: memberUser._id.toString(), role: 'user' });
      await communityController.deleteExperiencePost(ownerReq, ownerRes);
      assert(ownerRes.getStatusCode() === 200, 'Post owner successfully deleted own post (HTTP 200)');
    }

  } finally {
    // Cleanup test artifacts
    await ExperiencePostModel.deleteMany({ user: { $in: [memberUser._id, otherMember._id, staffUser._id, adminUser._id] } });
    await CommunityMessageModel.deleteMany({ activity: { $in: [attendedActivity._id, nonAttendedActivity._id] } });
    await CommunityReportModel.deleteMany({ reporter: { $in: [memberUser._id, otherMember._id] } });
    await RegistrationModel.deleteMany({ user: { $in: [memberUser._id, otherMember._id] } });
    await ActivityModel.deleteMany({ _id: { $in: [attendedActivity._id, nonAttendedActivity._id] } });
    await UserModel.deleteMany({ _id: { $in: [memberUser._id, otherMember._id, staffUser._id, adminUser._id] } });
    console.log('\n[TEST CLEANUP] Cleaned up temporary community test fixtures.');
  }

  console.log('\n========================================================');
  console.log(`📊 COMMUNITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCommunityTests().catch(err => {
  console.error('Community test execution failed:', err);
  process.exit(1);
});
