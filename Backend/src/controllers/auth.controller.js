const userModel = require('../models/users.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');
const {generateOTP} = require('../utils/otp');
const otpEmail = require('../templates/email.template');

async function registerUser(req, res) {
    const { username, email, password, role } = req.body;

    const existingUser = await userModel.findOne(
        { $or: [{ username }, { email }] }
    );
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword,
        role
    });
    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
    user.otp = hashedOTP;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendEmail(
        email,
        'Taru Ecommerce - Email Verification',
        otpEmail(username, otp)
    );


    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET
    );

    res.cookie('token', token);

    res.status(201).json({ message: 'User registered successfully , Please verify your Email', user });
}

async function LoginUser(req, res){
    const { email, password, username } = req.body;

    const user = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(!user){
        return res.status(400).json({message: 'Invalid email or password'});
    }

    const passwordMatch  = await bcrypt.compare(password, user.password);

    if(!passwordMatch){
        return res.status(400).json({message: 'Invalid password'});

    }

    const token = jwt.sign(
        {id: user._id, role: user.role},
        process.env.JWT_SECRET
    );

    res.cookie('token', token);

    res.status(200).json({message: 'User logged in successfully', user});
    
}

async function logoutUser(req, res){
    res.clearCookie('token');
    res.status(200).json({message: 'User logged out successfully'});
}

async function verifyOTP(req, res) {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            message: 'Email is already verified'
        });
    }

    if (!user.otp || !user.otpExpiresAt) {
        return res.status(400).json({
            message: 'No OTP found. Please request a new OTP'
        });
    }

    if (new Date() > user.otpExpiresAt) {
        return res.status(400).json({
            message: 'OTP has expired'
        });
    }

    const otpMatch = await bcrypt.compare(
        otp,
        user.otp
    );

    if (!otpMatch) {
        return res.status(400).json({
            message: 'Invalid OTP'
        });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
        message: 'Email verified successfully'
    });
}

module.exports = {
    registerUser,
    LoginUser,
    logoutUser,
    verifyOTP
};