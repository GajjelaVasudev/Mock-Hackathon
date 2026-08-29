const UserModel = require('../models/user.model');
const BadgeModel = require('../models/badge.model');
const RegistrationModel = require('../models/registration.model');

// each check receives the user's ATTENDED registrations (with activity populated)
// and returns true/false for whether that badge's criteria is met
const CRITERIA_CHECKS = {
    attend_1_activity: (attended) => attended.length >= 1,

    attend_5_activities: (attended) => attended.length >= 5,

    attend_1_conservation_project: (attended) =>
        attended.some(r => r.activity && r.activity.type === 'conservation-project'),

    attend_3_different_tags: (attended) => {
        const tags = new Set();
        attended.forEach(r => {
            if (r.activity && Array.isArray(r.activity.tags)) {
                r.activity.tags.forEach(tag => tags.add(tag));
            }
        });
        return tags.size >= 3;
    },

    attend_3_months: (attended) => {
        const months = new Set();
        attended.forEach(r => {
            if (r.attendedAt) {
                const d = new Date(r.attendedAt);
                months.add(`${d.getFullYear()}-${d.getMonth()}`);
            }
        });
        return months.size >= 3;
    }
};

async function checkAndAward(userId) {
    const [user, attended, allBadges] = await Promise.all([
        UserModel.findById(userId),
        RegistrationModel.find({ user: userId, status: 'attended' }).populate('activity'),
        BadgeModel.find()
    ]);

    if (!user) return [];

    const alreadyEarnedIds = new Set(user.badges.map(b => b.badge.toString()));
    const newlyAwarded = [];

    for (const badge of allBadges) {
        if (alreadyEarnedIds.has(badge._id.toString())) continue; // never award the same badge twice

        const checkFn = CRITERIA_CHECKS[badge.criteriaKey];
        if (!checkFn) continue; // unknown/mistyped criteriaKey — skip quietly rather than crash

        if (checkFn(attended)) {
            user.badges.push({ badge: badge._id, earnedAt: new Date() });
            newlyAwarded.push(badge);
        }
    }

    if (newlyAwarded.length > 0) {
        await user.save();
    }

    return newlyAwarded; // handy if you want the attendance response to say "you just earned: ..."
}

module.exports = { checkAndAward };