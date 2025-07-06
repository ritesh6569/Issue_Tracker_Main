import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME, // use environment variables
        pass: process.env.EMAIL_PASSWORD,  // use environment variables
    },
});

const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM, // use environment variable
        to: to,                       // receiver address
        subject: subject,
        text: text,
    };

    return transporter.sendMail(mailOptions);
};

export {sendEmail}
