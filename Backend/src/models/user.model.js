const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

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
        default: 'buyer',
        enum: ['seller', 'buyer', 'admin']
        
    },
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
    }
},{
    timestamps: true
});


const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
