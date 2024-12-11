// routes/loginRoute.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { route } = require('./loginRoute');


// POST /api/login
router.post('/', profileController.showAllUserData);
router.post('/addPet', profileController.addPet);
router.put('/editProfile', profileController.editUserProfile);
router.post('/removePet', profileController.removePet);
router.post('/picturePet', profileController.picturePet);
router.post('/showNotifications', profileController.showNotifications);
router.post('/showMessages', profileController.showMessages);
router.post('/acceptAdoptionMessage', profileController.acceptAdoptionMessage);
router.post('/rejectAdoptionMessage', profileController.rejectAdoptionMessage);
router.post('/giveAdoption', profileController.giveAdoption);
router.post('/getMessages', profileController.getMessages);
router.post('/rescuerApply', profileController.rescuerApply);
router.post('/pictureRescuer', profileController.pictureRescuer);
router.post('/getAllVets', profileController.getAllVets);
router.post('/applyForVet', profileController.applyForVet);
router.post('/viewAllRescuers', profileController.viewAllRescuers);
router.post('/scheduleVaccine', profileController.scheduleVaccine);
router.post('/addToVaccineSchedule', profileController.addToVaccineSchedule);
router.post('/viewAllScheduledVaccines', profileController.viewAllScheduledVaccines);
router.post('/getSpecificVet', profileController.getSpecificVet);
router.post('/incrementDose', profileController.incrementDose);
router.post('/getSpecificVaccinationSchedule', profileController.getSpecificVaccinationSchedule);
router.post('/getOwnVetAppointments', profileController.getOwnVetAppointments);
router.post('/viewAllVaccineMessages', profileController.viewAllVaccineMessages);
router.post('/wishlist', profileController.wishlist);
router.post('/addWishlist', profileController.addWishlist);

module.exports = router;
