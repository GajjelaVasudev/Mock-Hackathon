const registrationService = require("../services/registration.service");
const RegistrationModel = require('../models/registration.model');
const badgeService = require('../services/badge.service');


// REGISTER FOR ACTIVITY
const registerForActivity = async (req, res) => {

    try {

        const userId = req.user.id;
        const activityId = req.body.activityId;

        if (!activityId) {
            return res.status(400).json({
                message: "Activity ID is required"
            });
        }

        const registration =
            await registrationService.registerForActivity(
                userId,
                activityId
            );

        return res.status(201).json({
            message: "Registered for activity successfully",
            registration
        });

    } catch (error) {

        console.error(error);

        if (error.message === "Activity not found") {
            return res.status(404).json({
                message: "Activity not found"
            });
        }

        if (error.message === "Already registered for this activity") {
            return res.status(409).json({
                message: "Already registered for this activity"
            });
        }

        if (error.message === "Activity is full") {
            return res.status(409).json({
                message: "Activity is full"
            });
        }

        return res.status(500).json({
            message: "Failed to register for activity"
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


module.exports = {
    registerForActivity,
    markAttendance
};