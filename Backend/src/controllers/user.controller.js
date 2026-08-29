const UserModel = require('../models/user.model');
const RegistrationModel = require('../models/registration.model');
const badgeModel = require('../models/badge.model');

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
        UserModel.findById(userId).select('badges'),
        RegistrationModel.find({ user: userId, status: 'attended' }).populate('activity')
    ]);
    res.json({
        activities: registrations.map(r => r.activity),
        badges: user.badges
    });
}

module.exports = {
    getCurrentUser,
    updateCurrentUser,
    getUserJourney
};