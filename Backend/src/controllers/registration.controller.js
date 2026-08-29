const registrationService = require("../services/registration.service");
const RegistrationModel = require('../models/registration.model');
const badgeService = require('../services/badge.service');

// REGISTER FOR ACTIVITY
const registerForActivity = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role;
        const activityId = req.body.activityId || req.body.activity_id;

        if (userRole === 'admin') {
            return res.status(403).json({
                message: "Administrators cannot register for activities. Event participation is reserved for community members."
            });
        }

        if (!activityId) {
            return res.status(400).json({
                message: "Activity ID is required"
            });
        }

        const registration = await registrationService.registerForActivity(
            userId,
            activityId
        );

        return res.status(201).json({
            message: "Registered for activity successfully",
            registration,
            bookingId: registration.bookingId,
            activityTitle: registration.activityTitle,
            date: registration.date,
            location: registration.location
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        if (error.message === "Activity not found") {
            return res.status(404).json({
                message: "Activity not found"
            });
        }

        if (error.message === "Already registered for this activity") {
            return res.status(409).json({
                message: "You are already registered for this activity."
            });
        }

        if (error.message === "Activity is full") {
            return res.status(409).json({
                message: "Sorry, this activity is currently full."
            });
        }

        if (error.message.includes("cancelled") || error.message.includes("no longer available")) {
            return res.status(409).json({
                message: "This activity is no longer available (cancelled)."
            });
        }

        return res.status(500).json({
            message: error.message || "Failed to register for activity"
        });
    }
};

const markAttendance = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'attended' or 'no-show'

    if (!['attended', 'no-show'].includes(status)) {
        return res.status(400).json({ message: "status must be 'attended' or 'no-show'" });
    }

    const registration = await RegistrationModel.findByIdAndUpdate(
        id,
        { status, attendedAt: status === 'attended' ? new Date() : undefined },
        { new: true }
    );

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    let newBadges = [];
    if (status === 'attended') {
        newBadges = await badgeService.checkAndAward(registration.user);
    }

    res.json({ registration, newBadges });
};

// GET MY REGISTRATIONS
const getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user.id;

        const registrations = await registrationService.getMyRegistrations(userId);

        return res.status(200).json({
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to fetch your registrations"
        });
    }
};

// CANCEL A REGISTRATION
const cancelRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const registrationId = req.params.id;

        const registration = await registrationService.cancelRegistration(userId, registrationId);

        return res.status(200).json({
            message: "Registration cancelled successfully",
            registration
        });

    } catch (error) {
        console.error(error);

        if (error.message === "Registration not found") {
            return res.status(404).json({ message: "Registration not found" });
        }

        if (error.message === "Not authorized to cancel this registration") {
            return res.status(403).json({ message: "Not authorized to cancel this registration" });
        }

        if (error.message === "Cannot cancel a registration you already attended") {
            return res.status(409).json({ message: "Cannot cancel a registration you already attended" });
        }

        if (error.message === "Registration is already cancelled") {
            return res.status(409).json({ message: "Registration is already cancelled" });
        }

        return res.status(500).json({
            message: "Failed to cancel registration"
        });
    }
};

module.exports = {
    registerForActivity,
    markAttendance,
    getMyRegistrations,
    cancelRegistration
};