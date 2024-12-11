    // routes/loginRoute.js
    const express = require('express');
    const router = express.Router();
    const adminController = require('../controllers/adminController');
    
    
    // POST /api/login
    router.post('/', adminController.showDonationRequests);
    router.post('/showAllMembers',adminController.showAllMembers);
    router.post('/approvingDonations',adminController.approvingDonations);
    router.post('/rejectDonations',adminController.approvingDonations);
    router.post('/banMembers',adminController.banMembers);
    router.post('/unbanMembers',adminController.unbanMembers);
    router.post('/approveRescuers',adminController.approveRescuers);
    router.post('/showRescuerList',adminController.showRescuerList);
    router.post('/rejectRescuers',adminController.rejectRescuers);
        
    module.exports = router;
    