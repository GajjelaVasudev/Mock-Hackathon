const express = require("express");
const router = express.Router();

const activityController = require("../controllers/activity.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");


// GET ALL ACTIVITIES
// Any logged-in user can browse activities
router.get(
    "/",
    authMiddleware,
    activityController.getActivities
);


// GET ACTIVITY BY ID
// Any logged-in user can view activity details
router.get(
    "/:id",
    authMiddleware,
    activityController.getActivityById
);


// CREATE ACTIVITY
// Only staff and admin can create
router.post(
    "/",
    authMiddleware,
    authorize("staff", "admin"),
    activityController.createActivity
);


// UPDATE ACTIVITY
// Staff/admin
router.put(
    "/:id",
    authMiddleware,
    authorize("staff", "admin"),
    activityController.updateActivity
);


// CANCEL ACTIVITY
// Staff/admin
router.delete(
    "/:id",
    authMiddleware,
    authorize("staff", "admin"),
    activityController.cancelActivity
);


module.exports = router;