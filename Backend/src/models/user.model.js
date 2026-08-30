const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'user',
        enum: ['staff', 'admin', 'user']
        
    },
    interests:{
        type: [String],
        default: []
    },
    badges: [
            {
                badge: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Badge'
                },
                earnedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    isActive: {
        type: Boolean,
        default: true
    },
    otp:{
        type: String,
        default: null
    },
    otpExpiresAt:{
        type: Date,
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    volunteerStatus: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected'],
        default: 'none'
    },
    volunteerRequestedAt: Date,
    avatar: {
        type: String,
        default: null
    },
    savedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ExperiencePost'
        }
    ]
},{
    timestamps: true
});


const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
