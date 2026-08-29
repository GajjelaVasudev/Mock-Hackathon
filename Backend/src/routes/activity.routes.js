const asyncHandler = require('../utils/asyncHandler');
const express = require("express");
const router = express.Router();

const activityController = require("../controllers/activity.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");


//wrap every function in asynchandler
// GET ALL ACTIVITIES
// Any logged-in user
// GET /api/activities
router.get(
    "/",
    authMiddleware,
    asyncHandler(activityController.getActivities)
);


// GET PARTICIPANTS FOR AN ACTIVITY
// Staff/Admin
// GET /api/activities/:id/registrations
router.get(
    "/:id/registrations",
    authMiddleware,
    authorize("staff", "admin"),
    asyncHandler(activityController.getActivityRegistrations)
);


// GET ACTIVITY BY ID
// Any logged-in user
// GET /api/activities/:id
router.get(
    "/:id",
    authMiddleware,
    asyncHandler(activityController.getActivityById)
);


// CREATE ACTIVITY
// Staff/Admin
// POST /api/activities
router.post(
    "/",
    authMiddleware,
    authorize("staff", "admin"),
    asyncHandler(activityController.createActivity)
);


// UPDATE ACTIVITY
// Staff/Admin
// PUT /api/activities/:id
router.put(
    "/:id",
    authMiddleware,
    authorize("staff", "admin"),
    asyncHandler(activityController.updateActivity)
);


// CANCEL ACTIVITY
// Staff/Admin
// DELETE /api/activities/:id
router.delete(
    "/:id",
    authMiddleware,
    authorize("staff", "admin"),
    asyncHandler(activityController.cancelActivity)
);


module.exports = router;