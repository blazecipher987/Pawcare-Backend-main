// routes/loginRoute.js
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');



// POST /api/login
router.post('/', loginController.handleLogin);
// router.post('/', authenticateToken, loginController.handleLogin);


module.exports = router;
