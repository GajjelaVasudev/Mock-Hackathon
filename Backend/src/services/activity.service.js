const Activity = require("../models/activity.model");
const Registration = require("../models/registration.model");


// CREATE ACTIVITY
const createActivity = async (activityData, userId) => {
  const activity = await Activity.create({
    ...activityData,
    createdBy: userId,
  });

  return activity;
};


// GET ALL ACTIVITIES
const getActivities = async (filters = {}) => {
  const query = {};

  // Filter by tag
  if (filters.tag) {
    query.$or = [
        { tags: filters.tag },
        { interests: filters.tag }
    ];
}

  // Filter by type
  if (filters.type) {
    query.type = filters.type;
  }

  // Filter by status
  if (filters.status) {
    query.status = filters.status;
  }

  const activities = await Activity.find(query)
    .sort({ date: 1 });

  return activities;
};


// GET ACTIVITY BY ID
const getActivityById = async (activityId) => {
  const activity = await Activity.findById(activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  return activity;
};


// UPDATE ACTIVITY
const updateActivity = async (activityId, updateData) => {
  const activity = await Activity.findByIdAndUpdate(
    activityId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!activity) {
    throw new Error("Activity not found");
  }

  return activity;
};


// CANCEL ACTIVITY
const cancelActivity = async (activityId) => {
  const activity = await Activity.findByIdAndUpdate(
    activityId,
    {
      status: "cancelled",
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!activity) {
    throw new Error("Activity not found");
  }

  return activity;
};
// GET PARTICIPANTS FOR AN ACTIVITY
const getActivityRegistrations = async (activityId) => {

  // Check whether the activity exists
  const activity = await Activity.findById(activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  // Get all registrations for this activity
  const registrations = await Registration.find({
    activity: activityId
  })
    .populate("user", "name email")
    .sort({ registeredAt: 1 });

  return registrations;
};


module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  cancelActivity,
   getActivityRegistrations
};