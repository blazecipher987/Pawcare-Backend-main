// routes/donationRoutes.js
const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// GET /api/donations/all for fetching all donations
router.post('/', donationController.getAllDonations);
// router.get('/details/:donationId', donationController.showDonationDetails)
router.post('/details', donationController.showDonationDetails)
router.post('/makeDonation',donationController.makeDonation)
router.post('/donationSuccess/:tran_id',donationController.donationSuccess);
router.post('/donationFail',donationController.donationFail);
router.post('/application',donationController.insertCustomDonation);
router.post('/allMyDonationPosts',donationController.allMyDonationPosts);
router.post('/getDonationSubPoints',donationController.getDonationSubPoints);
router.post('/updateDonationSubPoints',donationController.updateDonationPoints);




module.exports = router;
