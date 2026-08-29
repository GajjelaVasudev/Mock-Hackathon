const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, subject, text) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[DEV EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
        console.log(`[DEV EMAIL CONTENT]:\n${text}`);
        return { response: 'Dev simulated email delivery' };
    }
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: text,
        text: typeof text === 'string' ? text.replace(/<[^>]*>?/gm, '') : text
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
}

module.exports = sendEmail;