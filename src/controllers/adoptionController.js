// controllers/loginController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const showAllAdoptPets = async (req, res) => {

    const{userID} = req.body;

    console.log(userID);
    try {
        const query = `
            SELECT u."Username", p."Name", p."Type", p."Breed", p."Age", p."Gender",p."URL", u."Address", p."PetID"
            FROM "Pet" p
            JOIN "User" u ON p."UserID" = u."UserID"
            WHERE p."AdoptionStatus" = $1 AND u."UserID" != $2
        `;
        // const values = [2]; // Value for AdoptionStatus

        const result = await db.query(query, [2,userID]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No pets found for adoption' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Error in showAllAdoptPets:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

const applyForAdoption = async (req, res) => {

    const{applierID, petID, ageStatus, vaccinationStatus, sprayedStatus, petAloneText, reasons} = req.body;

    // console.log(userID);
    try {

        const query2 = `SELECT * FROM "Pet" WHERE "PetID" = $1`;
        const result2 = await db.query(query2, [petID]);
        const ownerID = result2.rows[0].UserID;
        
        const query = `
        INSERT INTO "AdoptionRequests" (
            "ApplierID", 
            "OwnerID", 
            "PetID", 
            "AgeStatus", 
            "VaccinationStatus", 
            "SprayedStatus", 
            "PetAloneText", 
            "Reasons",
            "Disable",
            "AcceptStatus"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        
        `;
        // const values = [2]; // Value for AdoptionStatus

        const result = await db.query(query, [applierID, ownerID, petID, ageStatus, vaccinationStatus, sprayedStatus, petAloneText, reasons,0,2]);

        //^---- AccpetStatus 0: Rejected, 1: Aprroved, 2: Pending
        // if (result.rows.length === 0) {
        //     return res.status(404).json({ message: 'No pets found for adoption' });
        // }

        return res.status(200).json({ message: 'Added to AdoptionRequests Successfully' });
    } catch (error) {
        console.error('Error in showAllAdoptPets:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};



module.exports = { showAllAdoptPets ,applyForAdoption};