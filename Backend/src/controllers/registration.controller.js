const registrationService = require("../services/registration.service");

// REGISTER FOR ACTIVITY
const registerForActivity = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const activityId = req.body.activityId || req.body.activity_id;

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

module.exports = {
    registerForActivity
};