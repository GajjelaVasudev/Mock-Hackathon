const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },

    status: {
        type: String,
        enum: ['registered', 'attended', 'no-show', 'cancelled'],
        default: 'registered'
    },

    registeredAt: {
        type: Date,
        default: Date.now
    },

    attendedAt: {
        type: Date
    },

    feedback: {
        type: String,
        trim: true
    }

}, {
    timestamps: true
});

// One registration per user per activity
RegistrationSchema.index(
    { user: 1, activity: 1 },
    { unique: true }
);

const RegistrationModel = mongoose.model(
    'Registration',
    RegistrationSchema
);

module.exports = RegistrationModel;