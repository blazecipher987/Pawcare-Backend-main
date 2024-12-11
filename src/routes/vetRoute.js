    // routes/loginRoute.js
    const express = require('express');
    const router = express.Router();
    const vetController = require('../controllers/vetController');
    
    
    // POST /api/login
    router.post('/', vetController.getVetRequests);
    router.post('/rejectRequest',vetController.rejectRequest);
    

    
    module.exports = router;
    