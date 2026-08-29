const UserModel = require('../models/user.model');
const RegistrationModel = require('../models/registration.model');
const ActivityModel = require('../models/activity.model');
const EventLeadInvitation = require('../models/eventLeadInvitation.model');

async function getCurrentUser(req, res) {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateCurrentUser(req, res) {
    try {
        const userId = req.user.id;
        const { name, username, interests, experienceLevel, experience_level, location, age_group, preferred_activity_type } = req.body;
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                ...(name && { name }),
                ...(username && { username }),
                ...(interests && { interests }),
                ...(location && { location }),
                ...(age_group && { age_group }),
                ...(experienceLevel && { experienceLevel }),
                ...(experience_level && { experienceLevel: experience_level }),
                ...(preferred_activity_type && { preferred_activity_type })
            },
            { new: true, runValidators: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getUserJourney(req, res) {
    try {
        const userId = req.user.id;
        const [user, registrations] = await Promise.all([
            UserModel.findById(userId).select('badges').populate('badges.badge'),
            RegistrationModel.find({ user: userId, status: 'attended' }).populate('activity')
        ]);
        res.json({
            activities: registrations.map(r => r.activity),
            badges: user ? user.badges : []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getUserInvitations(req, res) {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const searchQueries = [{ userId: userId.toString() }];
        if (user.username) searchQueries.push({ userName: user.username });
        if (user.email) searchQueries.push({ userEmail: user.email.toLowerCase() });

        const invitations = await EventLeadInvitation.find({
            $or: searchQueries
        }).sort({ createdAt: -1 });

        res.json({ count: invitations.length, invitations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function acceptInvitation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const user = await UserModel.findById(userId);

        const invitation = await EventLeadInvitation.findById(id);
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

        invitation.status = 'accepted';
        invitation.respondedAt = new Date();
        await invitation.save();

        // Assign user as leader of the event in MongoDB
        const leaderName = user.name || user.username || invitation.userName;
        await ActivityModel.findOneAndUpdate(
            { $or: [{ id: invitation.eventId }, { _id: invitation.eventId.length === 24 ? invitation.eventId : null }] },
            { leader: leaderName }
        );

        res.json({
            message: 'Invitation accepted.',
            invitation
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function declineInvitation(req, res) {
    try {
        const { id } = req.params;
        const invitation = await EventLeadInvitation.findById(id);
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

        invitation.status = 'declined';
        invitation.respondedAt = new Date();
        await invitation.save();

        res.json({
            message: 'Invitation declined.',
            invitation
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
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
    getUserInvitations,
    acceptInvitation,
    declineInvitation,
    requestVolunteer
};