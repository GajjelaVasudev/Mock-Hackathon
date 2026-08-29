const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    criteriaKey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    icon: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

const BadgeModel = mongoose.model('Badge', BadgeSchema);

module.exports = BadgeModel;