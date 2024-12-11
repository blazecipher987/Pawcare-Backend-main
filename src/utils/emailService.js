// emailService.js in the 'utils' or 'services' directory
const { Pool } = require('pg');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (to) => {
  const msg = {
    to ,
    from : 'shahriarraj121@gmail.com',
    subject :  'Sending with SendGrid is Fun',
    text :  'and easy to do anywhere, even with Node.js',
    html : '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  sgMail.send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = sendEmail;
