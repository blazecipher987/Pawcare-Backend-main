const crypto = require('crypto');
const emailService = require('./emailService');
const otpModel = require('./otpModel');


//^---- Random OTP Generator
function generateOTP() {
    const otp = crypto.randomInt(100000, 999999); //* 6 Digits, unlike my salary(Which is 0... )
    return otp.toString();
}


//^---- For sending OTP via email to the user
async function sendOTPEmail(email, otp) {
    const msg = {
        to: email,
        from: 'shahriarraj121@gmail.com',
        subject: 'Your OTP for Registration',
        text: `Your OTP is: ${otp}`,
        html: `<h1> Welcome To PawCare </h1>
        <center><strong>Your OTP is: ${otp}</strong></center>`,
    };
    await emailService.sendEmail(msg);
}




//^---- Generates the OTP and sends it via email to the user trying to register @email
async function requestOTP(email, username, password, role, address, phoneNumber) {
    const otp = generateOTP();
    await otpModel.storeOTP(email, otp, username, password, role, address, phoneNumber);
    await sendOTPEmail(email, otp);
}

//^---- Returns whether the OTP is matched or not
async function verifyOTP(email, otp) {
    return await otpModel.verifyOTP(email, otp);
}

module.exports = {
    requestOTP,
    verifyOTP
};
