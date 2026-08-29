const UserModel = require('../models/user.model');
const RegistrationModel = require('../models/registration.model');

async function getCurrentUser(req, res) {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    res.json(user);
}

async function updateCurrentUser(req, res) {
    const userId = req.user.id;
    const { name, interests, experienceLevel } = req.body;
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { name, interests, experienceLevel },
        { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
}

async function getUserJourney(req, res) {
    const userId = req.user.id;
    const [user, registrations] = await Promise.all([
        UserModel.findById(userId).select('badges').populate('badges.badge'),
        RegistrationModel.find({ user: userId, status: 'attended' }).populate('activity')
    ]);
    res.json({
        activities: registrations.map(r => r.activity),
        badges: user.badges
    });
}

async function requestVolunteer(req, res) {
    const userId = req.user.id;
    const user = await UserModel.findById(userId).populate('badges.badge');

    const milestoneBadgeIds = new Set(
        user.badges
            .filter(b => b.badge && b.badge.isMilestone)
            .map(b => b.badge._id.toString())
    );
    const milestoneCount = milestoneBadgeIds.size;

    if (milestoneCount < 5) {
        return res.status(400).json({
            message: `You need all 5 milestone badges to request volunteer status. You currently have ${milestoneCount}/5.`
        });
    }
    if (user.volunteerStatus === 'requested') {
        return res.status(400).json({ message: 'Your volunteer request is already pending review' });
    }
    if (user.volunteerStatus === 'approved') {
        return res.status(400).json({ message: 'You are already an approved volunteer' });
    }

    user.volunteerStatus = 'requested';
    user.volunteerRequestedAt = new Date();
    await user.save();

    res.json({ message: 'Volunteer request submitted', volunteerStatus: user.volunteerStatus });
}

module.exports = {
    getCurrentUser,
    updateCurrentUser,
    getUserJourney,
    requestVolunteer
};