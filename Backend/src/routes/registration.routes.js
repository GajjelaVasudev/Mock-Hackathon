const express = require("express");

const router = express.Router();

const registrationController =
    require("../controllers/registration.controller");

const authMiddleware =
    require("../middlewares/auth.middleware");

const authorize =
    require("../middlewares/authorize.middleware");


// REGISTER FOR ACTIVITY
// Only normal users can register
// Admin cannot register
router.post(
    "/",
    authMiddleware,
    authorize("user"),
    registrationController.registerForActivity
);

router.patch('/:id/attendance', authMiddleware, authorize('staff', 'admin'), registrationController.markAttendance);


module.exports = router;