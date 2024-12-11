require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(msg) {
    try {
        await sgMail.send(msg);
        console.log('Email sent');
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    sendEmail
};
