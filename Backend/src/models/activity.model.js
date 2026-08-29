const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true,
        enum: ['trail', 'camp', 'course', 'monitoring', 'conservation-project']
    },

    tags: {
        type: [String],
        default: []
    },

    date: {
        type: Date,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }

}, {
    timestamps: true
});

const ActivityModel = mongoose.model('Activity', ActivitySchema);

module.exports = ActivityModel;