const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/email.service');
const { generateOTP } = require('../utils/otp');
const otpEmail = require('../templates/email.template');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerUser(req, res) {
    try {
        const {
            username,
            email,
            password,
            name,
            location,
            interests,
            experienceLevel,
            experience_level,
            age_group,
            preferred_activity_type
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedUsername = username.trim();

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        if (password.length < 3) {
            return res.status(400).json({ message: 'Password must be at least 3 characters long.' });
        }

        const existingUser = await userModel.findOne({
            $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
        });

        if (existingUser && existingUser.isEmailVerified) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const hashedPassword = await bcrypt.hash(password, 10);

        let user;
        if (existingUser && !existingUser.isEmailVerified) {
            existingUser.username = trimmedUsername;
            existingUser.email = trimmedEmail;
            existingUser.password = hashedPassword;
            if (name) existingUser.name = name;
            if (location) existingUser.location = location;
            if (interests) existingUser.interests = interests;
            if (experienceLevel || experience_level) existingUser.experienceLevel = experienceLevel || experience_level;
            if (age_group) existingUser.age_group = age_group;
            if (preferred_activity_type) existingUser.preferred_activity_type = preferred_activity_type;
            existingUser.otp = hashedOTP;
            existingUser.otpExpiresAt = otpExpiresAt;
            user = await existingUser.save();
        } else {
            user = await userModel.create({
                name: name || trimmedUsername,
                username: trimmedUsername,
                email: trimmedEmail,
                password: hashedPassword,
                location: location || 'Mumbai',
                interests: interests || ['birds'],
                experienceLevel: experienceLevel || experience_level || 'beginner',
                age_group: age_group || 'adult',
                preferred_activity_type: preferred_activity_type || 'walk',
                role: 'user',
                otp: hashedOTP,
                otpExpiresAt,
                isEmailVerified: false
            });
        }

        try {
            await sendEmail(trimmedEmail, 'BNHS India - Email Verification OTP', otpEmail(trimmedUsername, otp));
        } catch (err) {
            console.log('Notice: Email delivery simulated in dev mode:', err.message);
        }

        console.log(`\n========================================\n[BNHS OTP VERIFICATION CODE for ${trimmedEmail}]: ${otp}\n========================================\n`);

        res.status(201).json({
            message: 'OTP sent. Please verify your email to complete registration.',
            email: trimmedEmail
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: err.message || 'Internal server error during registration' });
    }
}

async function verifyOTP(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and 6-digit OTP are required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedOtp = otp.toString().trim();

        const user = await userModel.findOne({ email: trimmedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified. Please sign in.' });
        }

        if (!user.otp || !user.otpExpiresAt) {
            return res.status(400).json({ message: 'No OTP found. Please request a new OTP code.' });
        }

        if (new Date() > new Date(user.otpExpiresAt)) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP code.' });
        }

        const otpMatch = await bcrypt.compare(trimmedOtp, user.otp);
        if (!otpMatch) {
            return res.status(400).json({ message: 'Invalid OTP. Please check the code and try again.' });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role || 'user' },
            process.env.JWT_SECRET || 'bnhs_default_secret_jwt'
        );
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });

        const { password: _pw, otp: _otp, otpExpiresAt: _exp, ...safeUser } = user.toObject();
        res.status(200).json({
            message: 'Email verified successfully. You are now logged in.',
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ message: err.message || 'Internal server error during OTP verification' });
    }
}

async function resendOTP(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required to resend OTP.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email address.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified. Please sign in.' });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        user.otp = hashedOTP;
        user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        try {
            await sendEmail(trimmedEmail, 'BNHS India - Email Verification OTP', otpEmail(user.username, otp));
        } catch (err) {
            console.log('Notice: Email delivery simulated in dev mode:', err.message);
        }

        console.log(`\n========================================\n[BNHS RESENT OTP CODE for ${trimmedEmail}]: ${otp}\n========================================\n`);

        res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ message: err.message || 'Internal server error during OTP resend' });
    }
}

async function LoginUser(req, res) {
    try {
        const { email, password, username } = req.body;

        if (!password || (!email && !username)) {
            return res.status(400).json({ message: 'Please provide username/email and password.' });
        }

        const queryConditions = [];
        if (username) queryConditions.push({ username: username.trim() });
        if (email) queryConditions.push({ email: email.trim().toLowerCase() });

        const user = await userModel.findOne(
            queryConditions.length > 1 ? { $or: queryConditions } : queryConditions[0]
        );

        if (!user) {
            return res.status(400).json({ message: 'Invalid email/username or password.' });
        }

        let passwordMatch = false;
        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
            passwordMatch = await bcrypt.compare(password, user.password);
        } else if (user.password) {
            passwordMatch = (password === user.password);
        }

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid password. Please try again.' });
        }

        if (!user.isEmailVerified) {
            const otp = generateOTP();
            const hashedOTP = await bcrypt.hash(otp, 10);
            user.otp = hashedOTP;
            user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();

            try {
                await sendEmail(user.email, 'BNHS India - Email Verification OTP', otpEmail(user.username, otp));
            } catch (e) {}

            console.log(`\n========================================\n[BNHS OTP FOR UNVERIFIED LOGIN ${user.email}]: ${otp}\n========================================\n`);

            return res.status(403).json({
                message: 'Please verify your email before logging in. A new OTP has been sent to your email.',
                isUnverified: true,
                email: user.email
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role || 'user' },
            process.env.JWT_SECRET || 'bnhs_default_secret_jwt'
        );
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });

        const { password: _pw, otp: _otp, otpExpiresAt: _exp, ...safeUser } = user.toObject();
        res.status(200).json({ message: 'User logged in successfully', token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message || 'Internal server error during login' });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully' });
}

module.exports = {
    registerUser,
    LoginUser,
    verifyOTP,
    resendOTP,
    logoutUser
};
