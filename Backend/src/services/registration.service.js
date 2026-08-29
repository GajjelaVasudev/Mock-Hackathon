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


module.exports = {
    registerForActivity
};