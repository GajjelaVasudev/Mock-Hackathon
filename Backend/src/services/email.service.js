const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, subject, text) {
    const hasCredentials = process.env.EMAIL_USER &&
        process.env.EMAIL_PASS &&
        !process.env.EMAIL_USER.includes('your_email') &&
        !process.env.EMAIL_PASS.includes('your_app_password');

    if (!hasCredentials) {
        console.log(`\n[DEV EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
        console.log(`[DEV EMAIL CONTENT]:\n${text}\n`);
        return { response: 'Dev simulated email delivery' };
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: text,
            text: typeof text === 'string' ? text.replace(/<[^>]*>?/gm, '') : text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (err) {
        console.warn(`[EMAIL DELIVERY WARNING - FALLBACK TO DEV SIMULATION]: ${err.message}`);
        console.log(`\n[DEV EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
        console.log(`[DEV EMAIL CONTENT]:\n${text}\n`);
        return { response: 'Dev simulated fallback: ' + err.message };
    }
}

module.exports = sendEmail;