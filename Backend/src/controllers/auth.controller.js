const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');
const { generateOTP } = require('../utils/otp');
const otpEmail = require('../templates/email.template');

async function registerUser(req, res) {
    const { username, email, password } = req.body; // role dropped from destructure see note below

    const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });

    if (existingUser && existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
        // registered before never verified just resend a fresh OTP on the same account
        existingUser.otp = hashedOTP;
        existingUser.otpExpiresAt = otpExpiresAt;
        user = await existingUser.save();
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await userModel.create({
            username,
            email,
            password: hashedPassword,
            role: 'user', // never trust a clientsupplied role see note below
            otp: hashedOTP,
            otpExpiresAt
        });
    }

    try {
        await sendEmail(email, 'Taru Ecommerce - Email Verification', otpEmail(username, otp));
    } catch (err) {
        console.log('Error sending OTP email:', err);
        return res.status(500).json({ message: 'Could not send verification email. Please try again.' });
    }

    // no token here — they are not logged in until they verify
    res.status(201).json({ message: 'OTP sent. Please verify your email to complete registration.' });
}

async function LoginUser(req, res) {
    const { email, password, username } = req.body;

    const user = await userModel.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.cookie('token', token);

    const { password: _pw, otp: _otp, otpExpiresAt: _exp, ...safeUser } = user.toObject();
    res.status(200).json({ message: 'User logged in successfully', user: safeUser });
}

async function verifyOTP(req, res) {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email is already verified' });
    if (!user.otp || !user.otpExpiresAt) return res.status(400).json({ message: 'No OTP found. Please request a new OTP' });
    if (new Date() > user.otpExpiresAt) return res.status(400).json({ message: 'OTP has expired' });

    const otpMatch = await bcrypt.compare(otp, user.otp);
    if (!otpMatch) return res.status(400).json({ message: 'Invalid OTP' });

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // this is the real moment registration completes log them in now
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.cookie('token', token);

    const { password: _pw, otp: _otp, otpExpiresAt: _exp, ...safeUser } = user.toObject();
    res.status(200).json({ message: 'Email verified successfully. You are now logged in.', user: safeUser });
}

async function logoutUser(req, res) {
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully' });
}

module.exports = {
    registerUser,
    LoginUser,
    verifyOTP,
    logoutUser
};
