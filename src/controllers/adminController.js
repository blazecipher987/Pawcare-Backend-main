// controllers/loginController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;


const showDonationRequests = async (req, res) => {
    try {
        const { adminID } = req.body; // Get userID from request parameters

        // Fetch user details from the database
        const userQuery = 'SELECT * FROM "Donation" WHERE "Status" = $1';
        const userResult = await db.query(userQuery, [0]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userDetails = userResult.rows;


        // Prepare response (excluding sensitive information like Password)
        const response = {
            userDetails: userDetails,
            // userPets // Include the user's pets in the response
        };

        // Generate a token for authentication
        // const token = jwt.sign({ userId: userDetails.UserID, username: userDetails.Username }, secretKey, { expiresIn: '1h' });

        // Send the user details, pets, and token back
        res.status(200).json({message: 'User data fetched successfully', donationDetails : response}); 

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//*---- Invoked when the addpet form is filled up
const approvingDonations = async (req, res) => {
    try {
        const { donationID } = req.body; // Get userID from request parameters
        console.log(donationID);

        // Fetch user details from the database
        const userQuery = 'UPDATE "Donation" SET "Status" = 1 WHERE "DonationID" = $1 AND "Status" = 0';
        const userResult = await db.query(userQuery, [donationID]);

        // if (userResult.rows.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }

        // const userDetails = userResult.rows;
        // delete userDetails.Password; // Ensure Password is not included in the response

        // Fetch pets associated with the user
        // const petsQuery = 'SELECT * FROM "Pet" WHERE "UserID" = $1';
        // const petsResult = await db.query(petsQuery, [userID]);
        // const userPets = petsResult.rows;

        // Prepare response (excluding sensitive information like Password)
        const response = {
            userDetails: userResult,
            // userPets // Include the user's pets in the response
        };

        // Generate a token for authentication
        // const token = jwt.sign({ userId: userDetails.UserID, username: userDetails.Username }, secretKey, { expiresIn: '1h' });

        // Send the user details, pets, and token back
        res.status(200).json({message: 'Donation Req Accepted successfully'}); 

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//^---- Rejecting Donation Requests
const rejectDonations = async (req, res) => {
    try {
        const { donationID } = req.body; // Get userID from request parameters
        console.log(donationID);

        // Fetch user details from the database
        const userQuery = 'UPDATE "Donation" SET "Status" = 2 WHERE "DonationID" = $1 AND "Status" = 0';
        const userResult = await db.query(userQuery, [donationID]);

        // if (userResult.rows.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }

        const userDetails = userResult.rows;
        // delete userDetails.Password; // Ensure Password is not included in the response

        // Fetch pets associated with the user
        // const petsQuery = 'SELECT * FROM "Pet" WHERE "UserID" = $1';
        // const petsResult = await db.query(petsQuery, [userID]);
        // const userPets = petsResult.rows;

        // Prepare response (excluding sensitive information like Password)
        const response = {
            userDetails: userDetails,
            // userPets // Include the user's pets in the response
        };

        // Generate a token for authentication
        // const token = jwt.sign({ userId: userDetails.UserID, username: userDetails.Username }, secretKey, { expiresIn: '1h' });

        // Send the user details, pets, and token back
        res.status(200).json({message: 'Donation Req Rejected successfully', donationDetails : response}); 

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const banMembers = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'Update "LoginInfo" SET "Approval" = 0 WHERE "UserID" = $1';
        const result = await db.query(loginQuery, [userID]);

        res.status(200).json({
            message: "User Banned Successfully"
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const unbanMembers = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'Update "LoginInfo" SET "Approval" = 1 WHERE "UserID" = $1';
        const result = await db.query(loginQuery, [userID]);

        res.status(200).json({
            message: "User Banned Successfully"
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const showAllMembers = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'SELECT u.* FROM "User" u INNER JOIN "LoginInfo" l ON u."UserID" = l."UserID" WHERE l."Approval" = 1';
        const result = await db.query(loginQuery);

        res.status(200).json({
            message: "Showing All Users",
            users : result.rows
            
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//^---- GEt all the users who have applied to become a rescuer
//!----ApprovalStatus 0: Rejected, 1: Aprroved, 2: Pending
const showRescuerList = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'SELECT * FROM "RescuerApplications"';
        const result = await db.query(loginQuery);

        res.status(200).json({
            message: "Showing All Requests",
            users : result.rows
            
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//^---- Approve the users request to become a rescuer
//^ testing purpose
const approveRescuers = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'Update "RescuerApplications" SET "ApprovalStatus" = 1 WHERE "UserID" = $1';
        const result = await db.query(loginQuery, [userID]);

        const userTableQuery = 'Update "User" SET "Type" = 1 WHERE "UserID" = $1';
        const result2 = await db.query(userTableQuery, [userID]);
        // const result = await db.query(loginQuery);

        var str = "Congratulations, Your Request for becoming a rescuer was granted";
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [userID, str, 0])

        res.status(200).json({
            message: "User Approved Successfully",
            users : result.rows
            
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//^---- Reject the rescuers request to become a rescuer
const rejectRescuers = async(req, res) => {
    try {

        const {userID} = req.body;

        const loginQuery = 'Update "RescuerApplications" SET "ApprovalStatus" = 0 WHERE "UserID" = $1';
        const result = await db.query(loginQuery, [userID]);

        // const userTableQuery = 'Update "User" SET "Type" = 1 WHERE "UserID" = $1';
        // const result2 = await db.query(userTableQuery, [userID]);
        // const result = await db.query(loginQuery);

        var str = "Unfortunately, Your Request for becoming a rescuer was not granted";
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [userID, str, 0]);

        res.status(200).json({
            message: "User Approved Successfully",
            users : result.rows
            
        });
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {rejectRescuers, showRescuerList, showDonationRequests, approvingDonations, rejectDonations , banMembers, unbanMembers, showAllMembers,approveRescuers};
