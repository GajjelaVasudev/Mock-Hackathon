const activityService = require("../services/activity.service");


// CREATE ACTIVITY
const createActivity = async (req, res) => {
    try {
        const activityData = req.body;
        const userId = req.user.id;

        const activity = await activityService.createActivity(
            activityData,
            userId
        );

        return res.status(201).json({
            message: "Activity created successfully",
            activity
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to create activity"
        });
    }
};


// GET ALL ACTIVITIES
const getActivities = async (req, res) => {
    try {
        const filters = req.query;

        const activities = await activityService.getActivities(filters);

        return res.status(200).json({
            count: activities.length,
            activities
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch activities"
        });
    }
};


// GET ACTIVITY BY ID
const getActivityById = async (req, res) => {
    try {
        const activityId = req.params.id;

        const activity = await activityService.getActivityById(
            activityId
        );

        return res.status(200).json({
            activity
        });

    } catch (error) {
        console.error(error);

        if (error.message === "Activity not found") {
            return res.status(404).json({
                message: "Activity not found"
            });
        }

        return res.status(500).json({
            message: "Failed to fetch activity"
        });
    }
};


// UPDATE ACTIVITY
const updateActivity = async (req, res) => {
    try {
        const activityId = req.params.id;
        const updateData = req.body;

        const activity = await activityService.updateActivity(
            activityId,
            updateData
        );

        return res.status(200).json({
            message: "Activity updated successfully",
            activity
        });

    } catch (error) {
        console.error(error);

        if (error.message === "Activity not found") {
            return res.status(404).json({
                message: "Activity not found"
            });
        }

        return res.status(500).json({
            message: "Failed to update activity"
        });
    }
};


// CANCEL ACTIVITY
const cancelActivity = async (req, res) => {
    try {
        const activityId = req.params.id;

        const activity = await activityService.cancelActivity(
            activityId
        );

        return res.status(200).json({
            message: "Activity cancelled successfully",
            activity
        });

    } catch (error) {
        console.error(error);

        if (error.message === "Activity not found") {
            return res.status(404).json({
                message: "Activity not found"
            });
        }

        return res.status(500).json({
            message: "Failed to cancel activity"
        });
    }
};


module.exports = {
    createActivity,
    getActivities,
    getActivityById,
    updateActivity,
    cancelActivity
};