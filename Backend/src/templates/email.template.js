function otpEmail(username, otp) {
    return `
        <h2>Verify your email</h2>

        <p>Hello ${username},</p>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP will expire in 5 minutes.</p>

        <p>If you did not create this account, you can ignore this email.</p>
    `;
}

module.exports = otpEmail;