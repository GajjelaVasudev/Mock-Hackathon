const mongoose = require('mongoose');

const EventLeadInvitationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String
    },
    eventId: {
        type: String,
        required: true
    },
    eventTitle: {
        type: String,
        required: true
    },
    eventDate: {
        type: String
    },
    eventLocation: {
        type: String
    },
    invitedBy: {
        type: String,
        default: 'BNHS Staff'
    },
    message: {
        type: String,
        default: "We'd like to invite you to lead this BNHS event. Please confirm your availability."
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
        index: true
    },
    respondedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const EventLeadInvitation = mongoose.model('EventLeadInvitation', EventLeadInvitationSchema);

module.exports = EventLeadInvitation;
