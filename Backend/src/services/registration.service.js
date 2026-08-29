const Registration = require("../models/registration.model");
const Activity = require("../models/activity.model");


// REGISTER USER FOR ACTIVITY
const registerForActivity = async (userId, activityId) => {

    // Check whether activity exists
    const activity = await Activity.findById(activityId);

    if (!activity) {
        throw new Error("Activity not found");
    }

    // Check whether user already registered
    const existingRegistration =
        await Registration.findOne({
            user: userId,
            activity: activityId
        });

    if (existingRegistration) {
        throw new Error("Already registered for this activity");
    }

    // Check activity capacity
    const registeredCount =
        await Registration.countDocuments({
            activity: activityId,
            status: "registered"
        });

    if (registeredCount >= activity.capacity) {
        throw new Error("Activity is full");
    }

    // Create registration
    const registration =
        await Registration.create({
            user: userId,
            activity: activityId
        });

    return registration;
};

// GET MY REGISTRATIONS
const getMyRegistrations = async (userId) => {
    const registrations = await Registration.find({ user: userId })
        .populate("activity")
        .sort({ registeredAt: -1 });

    return registrations;
};

// CANCEL A REGISTRATION
const cancelRegistration = async (userId, registrationId) => {
    const registration = await Registration.findById(registrationId);

    if (!registration) {
        throw new Error("Registration not found");
    }

    if (registration.user.toString() !== userId) {
        throw new Error("Not authorized to cancel this registration");
    }

    if (registration.status === "attended") {
        throw new Error("Cannot cancel a registration you already attended");
    }

    if (registration.status === "cancelled") {
        throw new Error("Registration is already cancelled");
    }

    registration.status = "cancelled";
    await registration.save();

    return registration;
};


module.exports = {
    registerForActivity,
    getMyRegistrations,
    cancelRegistration
};