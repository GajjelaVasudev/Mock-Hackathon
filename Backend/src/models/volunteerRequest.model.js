const mongoose = require('mongoose');

const VolunteerRequestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        trim: true
    },
    userEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    userRole: {
        type: String,
        enum: ['user', 'staff', 'admin'],
        default: 'user'
    },
    opportunityId: {
        type: String,
        required: true
    },
    opportunityTitle: {
        type: String,
        required: true
    },
    opportunityLocation: {
        type: String,
        default: 'BNHS Mumbai / Field Sites'
    },
    opportunityTheme: {
        type: String,
        default: 'Conservation & Research'
    },
    message: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['user_application', 'admin_request'],
        default: 'user_application'
    },
    invitedBy: {
        type: String,
        default: null
    },
    attendedEvents: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    respondedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const VolunteerRequestModel = mongoose.model('VolunteerRequest', VolunteerRequestSchema);

module.exports = VolunteerRequestModel;
