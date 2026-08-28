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
    
    const mailOptions ={
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    }

    await transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });

}

module.exports = sendEmail;