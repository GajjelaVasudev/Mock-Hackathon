const crypto = require('crypto');
const RegistrationModel = require('../models/registration.model');
const ActivityModel = require('../models/activity.model');
const AchievementModel = require('../models/achievement.model');
const UserModel = require('../models/user.model');

const ACHIEVEMENT_TIERS = [
  {
    tier: 'SILVER',
    requiredEvents: 5,
    title: 'Silver Nature Explorer',
    reward: 'Certificate of Appreciation',
    defaultFulfillment: 'approved',
    description: 'Awarded for completing 5 verified BNHS nature walks, field trips, or conservation camps.',
  },
  {
    tier: 'GOLD',
    requiredEvents: 10,
    title: 'Gold Nature Explorer',
    reward: 'BNHS Nature Achievement Award',
    defaultFulfillment: 'pending_approval',
    description: 'Distinguished recognition for attending 10 verified BNHS conservation and nature activities.',
  },
  {
    tier: 'PLATINUM',
    requiredEvents: 15,
    title: 'Platinum Nature Explorer',
    reward: 'Opportunity for a BNHS nature/habitat tour',
    defaultFulfillment: 'pending_approval',
    description: 'Premier status granting exclusive invitation and opportunity for guided BNHS habitat tours.',
  },
];

/**
 * Generates a unique, official certificate reference ID
 * e.g., BNHS-SILVER-2026-A8F29E
 */
function generateCertificateId(tier, userId) {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BNHS-${tier}-${year}-${hex}`;
}

/**
 * Calculates verified attendance count for a user (strictly deduplicated by activity)
 */
async function calculateVerifiedAttendance(userId) {
  if (!userId) return { count: 0, attendedActivities: [] };

  const attendedRegistrations = await RegistrationModel.find({
    user: userId,
    status: 'attended',
  })
    .populate('activity')
    .sort({ attendedAt: -1, createdAt: -1 })
    .lean();

  // Deduplicate by distinct activity ID
  const seenActivityIds = new Set();
  const distinctAttended = [];

  for (const reg of attendedRegistrations) {
    if (!reg.activity) continue;
    const actId = reg.activity._id ? reg.activity._id.toString() : String(reg.activity);
    if (!seenActivityIds.has(actId)) {
      seenActivityIds.add(actId);
      distinctAttended.push(reg);
    }
  }

  return {
    count: distinctAttended.length,
    attendedActivities: distinctAttended,
  };
}

/**
 * Synchronizes and idempotently unlocks achievement tiers for a user
 */
async function syncUserAchievements(userId) {
  const { count } = await calculateVerifiedAttendance(userId);

  // Fetch already unlocked achievements for user
  const existingAchievements = await AchievementModel.find({ user: userId });
  const existingTierMap = new Map();
  existingAchievements.forEach((ach) => existingTierMap.set(ach.tier, ach));

  const newlyUnlocked = [];

  for (const tierConfig of ACHIEVEMENT_TIERS) {
    if (count >= tierConfig.requiredEvents) {
      if (!existingTierMap.has(tierConfig.tier)) {
        // Idempotently create achievement
        const certId = generateCertificateId(tierConfig.tier, userId);
        const achievement = await AchievementModel.create({
          user: userId,
          tier: tierConfig.tier,
          title: tierConfig.title,
          reward: tierConfig.reward,
          requiredEvents: tierConfig.requiredEvents,
          verifiedCountAtUnlock: count,
          unlockedAt: new Date(),
          certificateId: certId,
          fulfillmentStatus: tierConfig.defaultFulfillment,
        });

        existingTierMap.set(tierConfig.tier, achievement);
        newlyUnlocked.push(achievement);
      }
    }
  }

  return {
    verifiedCount: count,
    achievements: Array.from(existingTierMap.values()),
    newlyUnlocked,
  };
}

/**
 * Returns full achievement summary with progress calculation for user
 */
async function getUserAchievementSummary(userId) {
  const { verifiedCount, achievements } = await syncUserAchievements(userId);

  const achievementMap = new Map();
  achievements.forEach((ach) => achievementMap.set(ach.tier, ach));

  // Determine current highest tier and next tier
  let currentTier = null;
  let currentTitle = null;

  if (achievementMap.has('PLATINUM')) {
    currentTier = 'PLATINUM';
    currentTitle = 'Platinum Nature Explorer';
  } else if (achievementMap.has('GOLD')) {
    currentTier = 'GOLD';
    currentTitle = 'Gold Nature Explorer';
  } else if (achievementMap.has('SILVER')) {
    currentTier = 'SILVER';
    currentTitle = 'Silver Nature Explorer';
  }

  // Find next tier
  let nextTier = null;
  let nextTitle = null;
  let requiredForNext = null;
  let remainingForNext = 0;

  for (const tierConfig of ACHIEVEMENT_TIERS) {
    if (!achievementMap.has(tierConfig.tier)) {
      nextTier = tierConfig.tier;
      nextTitle = tierConfig.title;
      requiredForNext = tierConfig.requiredEvents;
      remainingForNext = Math.max(0, tierConfig.requiredEvents - verifiedCount);
      break;
    }
  }

  // Calculate progress percentage to next tier or 100% if maximum reached
  let progressPercentage = 100;
  if (nextTier && requiredForNext) {
    const prevRequired =
      nextTier === 'PLATINUM' ? 10 : nextTier === 'GOLD' ? 5 : 0;
    const progressInCurrentRange = Math.max(0, verifiedCount - prevRequired);
    const rangeSpan = requiredForNext - prevRequired;
    progressPercentage = Math.min(100, Math.round((progressInCurrentRange / rangeSpan) * 100));
  }

  // Build unified tier cards with status
  const tiers = ACHIEVEMENT_TIERS.map((tierConfig) => {
    const ach = achievementMap.get(tierConfig.tier);
    const isUnlocked = !!ach;
    const remainingEvents = Math.max(0, tierConfig.requiredEvents - verifiedCount);

    return {
      tier: tierConfig.tier,
      title: tierConfig.title,
      reward: tierConfig.reward,
      requiredEvents: tierConfig.requiredEvents,
      description: tierConfig.description,
      isUnlocked,
      unlockedAt: ach ? ach.unlockedAt : null,
      certificateId: ach ? ach.certificateId : null,
      fulfillmentStatus: ach ? ach.fulfillmentStatus : (isUnlocked ? 'unlocked' : 'locked'),
      fulfillmentNotes: ach ? ach.fulfillmentNotes : '',
      remainingEvents,
      verifiedCountAtUnlock: ach ? ach.verifiedCountAtUnlock : null,
      id: ach ? ach._id : null,
    };
  });

  return {
    verifiedAttendanceCount: verifiedCount,
    currentTier,
    currentTitle,
    nextTier,
    nextTitle,
    requiredForNext,
    remainingEventsToNextAchievement: remainingForNext,
    progressPercentage,
    tiers,
  };
}

/**
 * Returns detailed attendance history breakdown
 */
async function getUserAttendanceSummary(userId) {
  const { count, attendedActivities } = await calculateVerifiedAttendance(userId);

  const formattedActivities = attendedActivities.map((reg) => {
    const act = reg.activity || {};
    return {
      registrationId: reg._id,
      activityId: act._id || act.id,
      title: act.title || act.name || 'BNHS Nature Activity',
      date: act.date || act.startDate,
      location: act.location || 'BNHS Field Site',
      category: act.category || 'Nature & Wildlife',
      type: act.type || 'walk',
      attendedAt: reg.attendedAt || reg.updatedAt || reg.createdAt,
    };
  });

  return {
    verifiedAttendanceCount: count,
    activities: formattedActivities,
  };
}

/**
 * Fetches all unlocked achievements for Admin/Staff dashboard with fulfillment details
 */
async function getAdminAchievementsList({ page = 1, limit = 50, tier, status } = {}) {
  const query = {};
  if (tier && ['SILVER', 'GOLD', 'PLATINUM'].includes(tier.toUpperCase())) {
    query.tier = tier.toUpperCase();
  }
  if (status) {
    query.fulfillmentStatus = status;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, parseInt(limit, 10));

  const [achievements, total] = await Promise.all([
    AchievementModel.find(query)
      .sort({ unlockedAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('user', 'name username email role avatar')
      .populate('fulfilledBy', 'name username role')
      .lean(),
    AchievementModel.countDocuments(query),
  ]);

  return {
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / take),
    achievements,
  };
}

/**
 * Updates achievement fulfillment status (Staff / Admin action)
 */
async function updateFulfillment(achievementId, adminUserId, { fulfillmentStatus, fulfillmentNotes }) {
  if (!['unlocked', 'pending_approval', 'approved', 'completed'].includes(fulfillmentStatus)) {
    throw new Error("Invalid fulfillment status. Must be 'unlocked', 'pending_approval', 'approved', or 'completed'.");
  }

  const achievement = await AchievementModel.findById(achievementId).populate('user', 'name username email');
  if (!achievement) {
    throw new Error('Achievement record not found.');
  }

  achievement.fulfillmentStatus = fulfillmentStatus;
  if (fulfillmentNotes !== undefined) {
    achievement.fulfillmentNotes = fulfillmentNotes;
  }
  achievement.fulfilledBy = adminUserId;
  achievement.fulfilledAt = new Date();

  await achievement.save();

  return achievement;
}

module.exports = {
  ACHIEVEMENT_TIERS,
  calculateVerifiedAttendance,
  syncUserAchievements,
  getUserAchievementSummary,
  getUserAttendanceSummary,
  getAdminAchievementsList,
  updateFulfillment,
};
