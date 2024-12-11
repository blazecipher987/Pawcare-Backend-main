// routes/loginRoute.js
const express = require('express');
const router = express.Router();
const adoptionControllar = require('../controllers/adoptionController');



// POST /api/login
router.post('/', adoptionControllar.showAllAdoptPets);
router.post('/applyForAdoption',adoptionControllar.applyForAdoption);
// router.post('/', authenticateToken, loginController.handleLogin);


module.exports = router;
