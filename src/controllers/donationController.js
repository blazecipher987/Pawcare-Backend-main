// controllers/donationController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const axios = require('axios');

const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false //true for live, false for sandbox
port = 3000;

const getAllDonations = async (req, res) => {
    try {
        //^---- Get all the entries from the donation table along with the username from the user table
        //^---- Only fetch donations where the received amount is less than the total amount
        const donationQuery = `
            SELECT d.*, u."Username" 
            FROM "Donation" d
            INNER JOIN "User" u ON d."UserID" = u."UserID"
            WHERE d."ReceivedAmount" < d."TotalAmount" AND d."Status" = 1`;     //!---- Status code 1 for approved donations
        const { rows } = await db.query(donationQuery);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




//^---- Method(GET) for sending data of a certain donationID to the frontend. The donationId is carried in with the Link
const showDonationDetails = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { donationId } = req.body; //^---- Received from the request body
        console.log('Donation ID:', donationId);

        //^--- Join Donation table with User table to get Username along with donation info
        const donationQuery = `
            SELECT d.*, u."Username" 
            FROM "Donation" d
            INNER JOIN "User" u ON d."UserID" = u."UserID"
            WHERE d."DonationID" = $1`;
        const donationResult = await db.query(donationQuery, [donationId]);

        if (donationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        const donation = donationResult.rows[0];

        //^---- DonationSubPoints table infos
        const subStepsQuery = 'SELECT * FROM "DonationSubPoints" WHERE "DonationID" = $1';
        const subStepsResult = await db.query(subStepsQuery, [donationId]);
        const subSteps = subStepsResult.rows;

        //^---- DonationProofImages table Infos
        // const proofImagesQuery = 'SELECT * FROM "DonationProofImages" WHERE "DonationID" = $1';
        // const proofImagesResult = await db.query(proofImagesQuery, [donationId]);
        // const proofImages = proofImagesResult.rows;

        //^---- Single JSON object as response
        const donationDetails = {
            donation,  // Includes Username due to the join in the query
            subSteps
            // proofImages
        };

        res.json(donationDetails);
    } catch (error) {
        console.error('Error fetching donation details:', error);
        res.status(404).json({ message: 'Internal server error' });
    }
};





//^---- For the user to make a donation using SSLCOMMERZ
const makeDonation = async (req, res) => {
    const { amount, place, userID, donationID } = req.body; // Assuming these fields are provided

    // Basic validation (Enhance according to your need)
    if (!amount || !userID || !donationID) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try{

    // const userQuery = 'SELECT "Username", "Email", "PhoneNumber" FROM "Users" WHERE "UserID" = $1';
    
    const userQuery = 'SELECT "Username", "Email" FROM "User" WHERE "UserID" = $1';
    const userResult = await db.query(userQuery, [userID]);

    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    const cus_name = user.Name; // Assuming 'Name' is a column in your Users table
    const cus_email = user.Email; // Assuming 'Email' is a column in your Users table
    // const cus_phone = user.PhoneNumber; // Assuming 'PhoneNumber' is a column in your Users table

    const tran_id = `DON_${new Date().getTime()}`; // Unique transaction ID for each donation
    const success_url = `${process.env.APP_URL}/donation-success`;
    const fail_url = `${process.env.APP_URL}/donation-fail`;
    const cancel_url = `${process.env.APP_URL}/donation-cancel`;

    const postData = {
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        // success_url: success_url,
        success_url: `http://3.89.30.159:3000/donation/donationSuccess/${tran_id}`,     //!
        fail_url: 'http://localhost:3000/donation/donationFail',                        //!
        // success_url: `http://localhost:5173/donation/donationSuccess/${tran_id}`,
        // fail_url: 'http://localhost:5173/donation/donationFail',
        // success_url: `http://localhost:3000/donation/donationSuccess/${tran_id}`,
        // fail_url: 'http://localhost:3000/donation/donationFail',
        cancel_url: cancel_url,
        cus_name: cus_name, // Ideally, fetch from DB using userID
        cus_email: cus_email, // Ideally, fetch from DB using userID
        cus_add1: place,
        cus_city: '',
        cus_postcode: '',
        cus_country: 'Bangladesh',
        cus_phone: '01234567890', // Ideally, fetch from DB using userID
        shipping_method: 'NO',
        product_name: 'Donation',
        product_category: 'Donation',
        product_profile: 'non-physical-goods',
    };

    // Initiate the transaction with SSLCommerz
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(postData).then(async apiResponse => {

        const insertTransactionQuery = 'INSERT INTO "Transactions" ("TransactionID", "UserID", "DonationID", "DonationAmount") VALUES ($1, $2, $3, $4)';
        await db.query(insertTransactionQuery, [tran_id, userID, donationID, amount]);
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        // res.redirect(GatewayPageURL);
        res.send({ url: GatewayPageURL });
        console.log('Redirecting to: ', GatewayPageURL)
    });
}
catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ message: 'Error fetching user details from the database', error });
}

};


const donationSuccess = async (req, res) => {
    const { tran_id } = req.params; // Extract tran_id from URL parameters
    console.log(tran_id);


    try {
        // Retrieve the transaction details using tran_id
        const transactionQuery = 'SELECT "UserID", "DonationID", "DonationAmount" FROM "Transactions" WHERE "TransactionID" = $1';
        const transactionResult = await db.query(transactionQuery, [tran_id]);

        if (transactionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const {UserID, DonationID, DonationAmount } = transactionResult.rows[0];

        // Retrieve the current donation details
        const donationQuery = 'SELECT "ReceivedAmount","Description" FROM "Donation" WHERE "DonationID" = $1';
        const donationResult = await db.query(donationQuery, [DonationID]);

        if (donationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        const currentReceivedAmount = donationResult.rows[0].ReceivedAmount;
        const currName = donationResult.rows[0].Description;

        // Update the donation's received amount
        const newReceivedAmount = parseFloat(currentReceivedAmount) + parseFloat(DonationAmount);
        const updateDonationQuery ='UPDATE "Donation" SET "ReceivedAmount" = $1, "RequestDate" = CURRENT_TIMESTAMP WHERE "DonationID" = $2';
        await db.query(updateDonationQuery, [newReceivedAmount, DonationID]);
        

        //^---- Get the name of the donation event that we just donated to

        

        var str = "Your Donation of amount " + DonationAmount + " For The Donation Event Titled " + currName + " Has been received. Thank You";

        //^---- Addition for notifications table (Need userid first)
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [UserID, str, 0]);

        // res.status(200).json({ message: 'Donation updated successfully', DonationID, newReceivedAmount });
        res.redirect(`http://20.197.3.244/donation/donationSuccess/${tran_id}`);

    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};




const donationFail = (req, res) => {
    res.status(200).send("Hello world I have failed");
    console.log("Hey yaI failed");
    console.log("Here we are inside the dummy function");
};


const insertCustomDonation = async (req, res) => {
    const { userID, totalAmount, description, subPoints } = req.body; // Extract data from request body

    try {
        // Begin transaction
        // await db.query('BEGIN');

        // Insert into Donation table
        const donationInsertQuery = 'INSERT INTO "Donation" ("UserID", "TotalAmount", "ReceivedAmount", "Description", "Status") VALUES ($1, $2, $3, $4, $5) RETURNING "DonationID"';
        const donationInsertResult = await db.query(donationInsertQuery, [userID, totalAmount, 0, description, 0]);

        const donationID = donationInsertResult.rows[0].DonationID; // Get the DonationID of the newly inserted row

        // Insert into DonationSubPoints table
        const subPointsInsertQuery = 'INSERT INTO "DonationSubPoints" ("DonationID", "SubPointNumber", "Reason", "Checked") VALUES ($1, $3, $2, $4)';
        for (let i = 1; i <= subPoints.length; i++) {
            await db.query(subPointsInsertQuery, [donationID, subPoints[i-1], i, 'f']);
        }

        // Commit transaction
        // await db.query('COMMIT');
        new Date();
        var dateNow = Date.now();
        var dateStr = dateNow.getDate() + "-" + dateNow.getMonth() + "-" + dateNow.getFullYear();
        

        //^---- Addition for notifications table (Need userid first)
        var str = "Your Donation request has been posted , Title: " + description + ", Date:  " + dateStr ;
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [userID, str, 0]);

        //^---- Addition for Forum Posts ( 0: ORIGINAL POSTS, 1:DONATION, 2:ADOPTION)
        const forumQuery = 'INSERT INTO "PostTable" ("Type","OtherID") VALUES ($1,$2)';
        const forumResult = await db.query(forumQuery, [1,donationID]);


        res.status(200).json({ message: 'Donation and sub points inserted successfully', donationID });
    } catch (error) {
        // Rollback transaction on error
        // await db.query('ROLLBACK');
        
        console.error('Error making donation:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};


const allMyDonationPosts = async (req, res) => {
    const { userID } = req.body; // Extract data from request body

    try {
        //^---- Get all the entries from the donation table along with the username from the user table
        //^---- Only fetch donations where the received amount is less than the total amount
        const donationQuery = `
            SELECT d.*, u."Username" 
            FROM "Donation" d
            INNER JOIN "User" u ON d."UserID" = u."UserID"
            WHERE u."UserID" = $1 AND d."ReceivedAmount" < d."TotalAmount" AND d."Status" = 1`;     //!---- Status code 1 for approved donations
        const { rows } = await db.query(donationQuery,[userID]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getDonationSubPoints = async (req, res) => {
    // Assuming donationid is sent as a query parameter or part of the URL path
    const { donationid } = req.body; // or use req.query.donationid if passed as a query parameter

    try {
        const query = `
            SELECT "DonationID", "SubPointNumber", "Reason", "Checked"
            FROM "DonationSubPoints"
            WHERE "DonationID" = $1 AND "Checked" = 'f'
        `;
        const values = [donationid];

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No unchecked subpoints found for this donation ID' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching donation subpoints:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

//^---- Used for updating the donation subpoints, takes as input the points which are false with a donation ID, then makes them true
const updateDonationPoints = async (req, res) => {
    try {
        const { donationid, subPoints } = req.body;

        // Checking if donationID and subPoints are provided
        if (!donationid || !subPoints || !Array.isArray(subPoints)) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Update "Checked" column in donationSubPoints table
        const updateQuery = `
            UPDATE "DonationSubPoints" 
            SET "Checked" = 't'
            WHERE "DonationID" = $1 
            AND "SubPointNumber" = ANY($2::int[])
        `;
        await db.query(updateQuery, [donationid, subPoints]);

        // Return success message
        res.status(200).json({ message: 'Donation points updated successfully' });
    } catch (error) {
        console.error('Error updating donation points:', error);
        res.status(500).json({ error: 'An error occurred while updating donation points.' });
    }
};



module.exports = {
    getAllDonations,
    showDonationDetails,
    makeDonation,
    donationSuccess,
    donationFail,
    insertCustomDonation,
    allMyDonationPosts,
    getDonationSubPoints,
    updateDonationPoints
};
