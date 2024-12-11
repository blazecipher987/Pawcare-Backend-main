// controllers/loginController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;



const getVetRequests = async (req, res) => {
    try {
        // Extract vetID from request parameters
        const { vetID } = req.body;

        // SQL query to select all entries from VetRequests where VetID matches
        const vetName = 'SELECT "Name","URL" FROM "VetInfo" WHERE "ID" = $1';
        const vetNameResult = await db.query(vetName, [vetID]);
        const vetName1 = vetNameResult.rows[0].Name;
        const vetURL = vetNameResult.rows[0].URL;

        const query = `
            SELECT * FROM "VetRequests"
            WHERE "VetID" = $1 AND "Status" = 1;
        `;

        // Assuming db is your database connection variable
        const result = await db.query(query, [vetID]);
        const vetRequests = result.rows;

        // Check if we found any vet requests
        if (result.rows.length >= 0) {
            res.status(200).json({ vetRequests, vetName: vetName1, vetURL: vetURL });
        } else {
            res.status(404).json({ message: 'No vet requests found for the given vet ID' });
        }
    } catch (error) {
        console.error('Error fetching vet requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//^---- If the vet decides to reject the request, by default we always assume the appointment is accepted
const rejectRequest = async (req, res) => {
    try {
        // Extract requestID from request parameters
        const { requestID } = req.body;

        // SQL query to update the request status to approved
        const query = `
            UPDATE "VetRequests"
            SET "Status" = 0
            WHERE "ReqID" = $1;
        `;
        const result = await db.query(query, [requestID]);

        const query1 = `SELECT * FROM "VetRequests" WHERE "ReqID" = $1`;
        const result1 = await db.query(query1, [requestID]);

        const vetid = result1.rows[0].VetID;
        const date = result1.rows[0].Date;
        const requestedslot = result1.rows[0].RequestedSlot;
        const userid = result1.rows[0].UserID;

        console.log(vetid, date, requestedslot, userid);

        const query3 = `SELECT "Name" FROM "VetInfo" WHERE "ID" = $1`;
        const result3 = await db.query(query3, [vetid]);
        const vetName = result3.rows[0].Name;
        console.log(vetName);

        // const query2 = `SELECT `;

        // const query2 = `SELECT "UserID", "Date", "RequestedSlot", "VetID" FROM "VetRequests" WHERE "ReqID" = $1`;
        // const result2 = await db.query(query2, [requestID]);
        // const {serID, date, requestedSlot, vetID} = result2.rows;

        // console.log(userID, date, requestedSlot, vetID);
        
        // const query3 = `SELECT "Name" FROM "VetInfo" WHERE "ID" = $1`;
        // const result3 = await db.query(query3, [vetID]);
        // const {vetName} = result3.rows;
        // // const userID = result2.rows[0].UserID;

        // //send notification to the user and entry to the notification table
        var str = "Unfortunately, Your Appointment has been cancalled with " + vetName + ",which was booked for Date: " + date + ", on the slot: " + requestedslot;
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [userid, str, 0]);
        

        // Assuming db is your database connection variable
        

        // Check if the request was updated
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Request approved successfully' });
        } else {
            res.status(404).json({ message: 'No request found for the given request ID' });
        }
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { getVetRequests,rejectRequest };
