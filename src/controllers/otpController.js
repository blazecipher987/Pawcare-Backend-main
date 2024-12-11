// otpController.js
const express = require('express');
const otpService = require('./otpService');
const router = express.Router();


//^---- Request for the OTP after registration
router.post('/request-otp', async (req, res) => {
    const email = req.body.email;   //* Will contain all the form info of the user trying to register, but we only need to user the email 
    await otpService.requestOTP(email);
    res.send('OTP sent to email');
});

//^---- Verify the OTP to complete successful registration
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const isValid = await otpService.verifyOTP(email, otp);
    if (isValid) {
        res.send('OTP is valid');
    } else {
        res.status(400).send('Invalid OTP or OTP expired');
    }
});

module.exports = router;
