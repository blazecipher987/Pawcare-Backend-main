// routes/loginRoute.js
const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');


// POST /api/login
router.post('/', registerController.handleRegister);
router.post('/verifyOTP', registerController.verifyOTP);


module.exports = router;
