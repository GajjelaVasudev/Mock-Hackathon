const asyncHandler = require('../utils/asyncHandler');
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
    asyncHandler((req, res) => {
        authMiddleware(req, res, () => {
            authorize("user")(req, res, () => {
                registrationController.registerForActivity(req, res);
            });
        });
    })
);

router.patch('/:id/attendance', authMiddleware, authorize('staff', 'admin'), asyncHandler(registrationController.markAttendance));


module.exports = router;