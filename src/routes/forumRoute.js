// routes/loginRoute.js
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/forumController');



// POST /api/login
router.post('/', loginController.showAllForumPosts);
router.post('/reply', loginController.addReply);
router.post('/addPost', loginController.addPost);


// router.post('/', authenticateToken, loginController.handleLogin);


module.exports = router;
