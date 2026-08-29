const mongoose = require("mongoose");
const Registration = require("../models/registration.model");
const Activity = require("../models/activity.model");

// REGISTER USER FOR ACTIVITY
const registerForActivity = async (userId, activityId) => {
    if (!activityId) {
        throw new Error("Activity ID is required");
    }

    // 1. Resolve activity by ObjectId or string id
    let activity = null;
    if (mongoose.Types.ObjectId.isValid(activityId)) {
        activity = await Activity.findOne({
            $or: [{ _id: activityId }, { id: activityId }]
        });
    } else {
        activity = await Activity.findOne({ id: activityId });
    }

    if (!activity) {
        throw new Error("Activity not found");
    }

    if (activity.status === 'cancelled') {
        throw new Error("This activity is no longer available (cancelled)");
    }

    // 2. Check whether user already registered for this activity
    const existingRegistration = await Registration.findOne({
        user: userId,
        activity: activity._id,
        status: { $ne: 'cancelled' }
    });

    if (existingRegistration) {
        throw new Error("Already registered for this activity");
    }

    // 3. Check activity capacity
    const registeredCount = await Registration.countDocuments({
        activity: activity._id,
        status: 'registered'
    });

    const maxCapacity = activity.capacity || 30;
    if (registeredCount >= maxCapacity || activity.status === 'full') {
        throw new Error("Activity is full");
    }

    // 4. Create registration
    const registration = await Registration.create({
        user: userId,
        activity: activity._id,
        status: 'registered',
        registeredAt: new Date()
    });

    // Update activity registered count and status
    activity.registeredCount = registeredCount + 1;
    if (activity.registeredCount >= maxCapacity) {
        activity.status = 'full';
    }
    await activity.save();

    const bookingId = 'REG-BNHS-' + registration._id.toString().slice(-6).toUpperCase();

    return {
        ...registration.toObject(),
        bookingId,
        activityTitle: activity.name || activity.title,
        date: activity.date,
        location: activity.location,
        type: activity.type
    };
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