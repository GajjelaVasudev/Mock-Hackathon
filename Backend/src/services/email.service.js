const nodemailer = require('nodemailer');

function getEmailConfig() {
    const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
    const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';
    const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const isConfigured = Boolean(
        emailUser &&
        emailPass &&
        !emailUser.includes('your_email') &&
        !emailPass.includes('your_app_password')
    );

    return {
        emailUser,
        emailPass,
        smtpHost,
        smtpPort,
        isConfigured
    };
}

function createTransporter() {
    const config = getEmailConfig();
    return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
            user: config.emailUser,
            pass: config.emailPass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

async function verifySMTP() {
    const config = getEmailConfig();
    console.log('\n--- [SMTP DIAGNOSTIC CHECK] ---');
    console.log(`EMAIL_USER: ${config.emailUser ? `Configured (${config.emailUser.slice(0, 3)}***@${config.emailUser.split('@')[1] || ''})` : 'NOT CONFIGURED'}`);
    console.log(`EMAIL_PASS: ${config.emailPass ? 'Configured (Hidden)' : 'NOT CONFIGURED'}`);
    console.log(`SMTP_HOST: ${config.smtpHost}`);
    console.log(`SMTP_PORT: ${config.smtpPort}`);
    console.log(`SMTP_SECURE: ${config.smtpPort === 465}`);

    if (!config.isConfigured) {
        console.log('Status: SMTP credentials not configured. Development console simulation will be used.');
        console.log('-------------------------------\n');
        return { isConfigured: false, verified: false, reason: 'Credentials not configured' };
    }

    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('Status: Transporter verified successfully with SMTP provider.');
        console.log('-------------------------------\n');
        return { isConfigured: true, verified: true };
    } catch (err) {
        console.error('Status: Transporter verification FAILED:', err.message);
        if (err.code === 'EAUTH') {
            console.error('Hint: Gmail requires an App Password (16 characters from Google Account -> Security -> 2-Step Verification -> App Passwords) rather than your standard account password.');
        }
        console.log('-------------------------------\n');
        return { isConfigured: true, verified: false, error: err.message, code: err.code };
    }
}

async function sendEmail(to, subject, htmlContent) {
    const config = getEmailConfig();
    const recipient = (to || '').trim().toLowerCase();

    console.log('\n=== [EMAIL DELIVERY INVOCATION] ===');
    console.log(`Recipient: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(`EMAIL_USER configured: ${Boolean(config.emailUser)}`);
    console.log(`EMAIL_PASS configured: ${Boolean(config.emailPass)}`);
    console.log(`SMTP Target: ${config.smtpHost}:${config.smtpPort}`);

    if (!config.isConfigured) {
        console.log('Mode: Development Simulation (SMTP credentials not provided in .env)');
        console.log(`[DEV EMAIL SIMULATION] To: ${recipient} | Subject: ${subject}`);
        console.log(`[DEV EMAIL CONTENT]:\n${htmlContent}\n`);
        console.log('===================================\n');
        return {
            delivered: false,
            mode: 'dev_simulation',
            message: 'OTP generated in development mode'
        };
    }

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"BNHS India" <${config.emailUser}>`,
            to: recipient,
            subject: subject,
            html: htmlContent,
            text: typeof htmlContent === 'string' ? htmlContent.replace(/<[^>]*>?/gm, '') : htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Mode: Real SMTP Delivery SUCCESS');
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Provider Response: ${info.response}`);
        console.log('===================================\n');

        return {
            delivered: true,
            mode: 'smtp',
            messageId: info.messageId,
            response: info.response,
            message: 'OTP sent successfully to your email.'
        };
    } catch (err) {
        console.error('Mode: Real SMTP Delivery FAILED');
        console.error(`Error Code: ${err.code || 'N/A'}`);
        console.error(`Error Message: ${err.message}`);
        console.log('===================================\n');

        const error = new Error(`Email delivery failed via ${config.smtpHost}: ${err.message}`);
        error.code = err.code;
        error.isDeliveryFailure = true;
        throw error;
    }
}

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.verifySMTP = verifySMTP;
module.exports.getEmailConfig = getEmailConfig;