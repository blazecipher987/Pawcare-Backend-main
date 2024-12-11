// controllers/loginController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = 'TheWorldIsNotForTheWeakHearted';


const showAllUserData = async (req, res) => {
    try {
        const { userID } = req.body; // Get userID from request parameters

        // Fetch user details from the database
        const userQuery = 'SELECT * FROM "User" WHERE "UserID" = $1';
        const userResult = await db.query(userQuery, [userID]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userDetails = userResult.rows[0];
        delete userDetails.Password; // Ensure Password is not included in the response

        // Fetch pets associated with the user
        const petsQuery = 'SELECT * FROM "Pet" WHERE "UserID" = $1';
        const petsResult = await db.query(petsQuery, [userID]);
        const userPets = petsResult.rows;

        // Prepare response (excluding sensitive information like Password)
        const response = {
            userDetails: userDetails,
            userPets // Include the user's pets in the response
        };

        // Generate a token for authentication
        const token = jwt.sign({ userId: userDetails.UserID, username: userDetails.Username }, secretKey, { expiresIn: '1h' });

        // Send the user details, pets, and token back
        res.status(200).json({ message: 'User data fetched successfully', userDetails: response, token });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//*---- Invoked when the addpet form is filled up
const addPet = async (req, res) => {
    try {

        //^---- Getting the info from the req body
        const { UserID, Name, Type, Breed, Age, Gender, AdoptionStatus } = req.body; // Extract pet info from request body

        //^---- Checking if all the parameters have been filled up
        if (!UserID || !Name || !Type || !Breed || !Age || !Gender || !AdoptionStatus) {
            return res.status(400).json({ message: 'Missing required pet information' });
        }

        //^---- IF everything okkey, then go towards entering the data into the table
        const petInsertQuery = 'INSERT INTO "Pet" ("UserID", "Name", "Type", "Breed", "Age", "Gender", "AdoptionStatus") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const { rows } = await db.query(petInsertQuery, [UserID, Name, Type, Breed, Age, Gender, 1]);
        const newPet = rows[0];

        //^---- Return the newly created pet object
        res.status(201).json(newPet);
    } catch (error) {
        console.error('Error adding new pet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const editUserProfile = async (req, res) => {
    try {
        const { UserID, Username, Email, Role, Address, Password } = req.body; // Extract user info from request body

        // Update user profile in the User table
        const updateUserQuery = `
            UPDATE "User"
            SET "Username" = $2, "Role" = $3, "Address" = $4
            WHERE "UserID" = $1
            RETURNING *`;
        const updatedUserResult = await db.query(updateUserQuery, [UserID, Username, Role, Address]);
        const updatedUser = updatedUserResult.rows[0];

        // Optionally, check if the Email or Password should be updated in the LoginInfo table
        if (Email || Password) {
            let updateLoginInfoQuery = 'UPDATE "LoginInfo" SET ';
            const queryValues = [];
            let queryCounter = 1;

            if (Email) {
                updateLoginInfoQuery += `"Email" = $${queryCounter}, `;
                queryValues.push(Email);
                queryCounter++;
            }

            if (Password) {
                // Hash the new password before storing
                const hashedPassword = await bcrypt.hash(Password, 10);
                updateLoginInfoQuery += `"Password" = $${queryCounter}, `;
                queryValues.push(hashedPassword);
                queryCounter++;
            }

            // Remove trailing comma and space
            updateLoginInfoQuery = updateLoginInfoQuery.slice(0, -2);
            updateLoginInfoQuery += ` WHERE "UserID" = $${queryCounter}`;
            queryValues.push(UserID);

            await db.query(updateLoginInfoQuery, queryValues);
        }

        // Respond with a success message
        res.status(200).json({ message: 'User profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//!---- Change to incorporate the removepet functionality
const removePet = async (req, res) => {
    try {
        const { userID, petID } = req.body; // Extract userID and petID from request body

        const adoption = 'DELETE FROM "Adoption" WHERE "PetID" = $1';
        await db.query(adoption, [petID]);

        const appointment = 'DELETE FROM "Appointment" WHERE "PetID" = $1';
        await db.query(appointment, [petID]);

        const vaccinationHistory = 'DELETE FROM "VaccinationHistory" WHERE "PetID" = $1';
        await db.query(vaccinationHistory, [petID]);

        const deletePPetQuery = 'DELETE FROM "PetProfile" WHERE "PetID" = $1';
        await db.query(deletePPetQuery, [petID]);

        // Delete the specified pet
        const deletePetQuery = 'DELETE FROM "Pet" WHERE "UserID" = $1 AND "PetID" = $2';
        await db.query(deletePetQuery, [userID, petID]);



        // After deletion, fetch updated user details
        const userQuery = 'SELECT * FROM "User" WHERE "UserID" = $1';
        const userResult = await db.query(userQuery, [userID]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userDetails = userResult.rows[0];
        delete userDetails.Password; // Exclude Password from the response

        // Fetch updated list of pets excluding the deleted one
        const petsQuery = 'SELECT * FROM "Pet" WHERE "UserID" = $1';
        const petsResult = await db.query(petsQuery, [userID]);
        const userPets = petsResult.rows;

        // Prepare and send the response
        const response = {
            userDetails,
            userPets
        };
        res.status(200).json({ message: 'Pet removed successfully', userDetails: response });

    } catch (error) {
        console.error('Error removing pet:', error);
        res.status(500).json({ message: 'Internal server error', msg: error });
    }
};


const picturePet = async (req, res) => {
    try {
        const { UserID, PetID, URL } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        if (!UserID || !PetID || !URL) {
            return res.status(400).json({ message: 'Missing required fields: UserID, PetID, and URL are all required.' });
        }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'UPDATE "Pet" SET "URL" = $1 WHERE "PetID" = $2 AND "UserID" = $3';
        const updateResult = await db.query(updateQuery, [URL, PetID, UserID]);

        // Check if the update was successful (i.e., if any row was actually updated)
        if (updateResult.rowCount === 0) {
            // No rows were updated, which means no matching pet was found
            return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        }

        // If the update was successful, send a success response
        res.status(200).json({ message: 'Pet picture updated successfully.' });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};



const showNotifications = async (req, res) => {
    try {
        const { UserID } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        // if (!UserID || !PetID || !URL) {
        //     return res.status(400).json({ message: 'Missing required fields: UserID, PetID, and URL are all required.' });
        // }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'SELECT * FROM "Notification" WHERE "UserID" = $1';
        const updateResult = await db.query(updateQuery, [UserID]);


        //^----- For enabling the Read Status after viewing one time
        const readStatusQuery = 'UPDATE "Notification" SET "ReadStatus" = 1';
        const updated = await db.query(readStatusQuery);

        // Check if the update was successful (i.e., if any row was actually updated)
        // if (updateResult.rowCount === 0) {
        //     // No rows were updated, which means no matching pet was found
        //     return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        // }

        // If the update was successful, send a success response
        res.status(200).json({ message: 'Getting all the notifications', result: updateResult.rows });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};




const showMessages = async (req, res) => {
    try {
        const { userID } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        // if (!UserID || !PetID || !URL) {
        //     return res.status(400).json({ message: 'Missing required fields: UserID, PetID, and URL are all required.' });
        // }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'SELECT * FROM "AdoptionRequests" WHERE "OwnerID" = $1 AND "AcceptStatus" = $2 AND "Disable" = $3';
        const updateResult = await db.query(updateQuery, [userID, 2, 0]);


        //^----- For enabling the Read Status after viewing one time
        // const readStatusQuery = 'UPDATE "Notification" SET "ReadStatus" = 1';
        // const updated = await db.query(readStatusQuery);

        // Check if the update was successful (i.e., if any row was actually updated)
        // if (updateResult.rowCount === 0) {
        //     // No rows were updated, which means no matching pet was found
        //     return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        // }

        // If the update was successful, send a success response
        res.status(200).json({ message: 'Getting all the notifications', result: updateResult.rows });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};





const acceptAdoptionMessage = async (req, res) => {
    try {
        const { requestID } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        // if (!UserID || !PetID || !URL) {
        //     return res.status(400).json({ message: 'Missing required fields: UserID, PetID, and URL are all required.' });
        // }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'SELECT * FROM "AdoptionRequests" WHERE "RequestID" = $1';
        const updateResult = await db.query(updateQuery, [requestID]);

        const query3 = 'UPDATE "Pet" SET "AdoptionStatus" = $1 WHERE "PetID" = $2';
        const result3 = await db.query(query3, [1, updateResult.rows[0].PetID]);


        //^----- For enabling the Read Status after viewing one time
        // const readStatusQuery = 'UPDATE "Notification" SET "ReadStatus" = 1';
        // const updated = await db.query(readStatusQuery);

        // Check if the update was successful (i.e., if any row was actually updated)
        // if (updateResult.rowCount === 0) {
        //     // No rows were updated, which means no matching pet was found
        //     return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        // }

        const query1 = 'UPDATE "AdoptionRequests" SET "AcceptStatus" = $1 , "Disable" = $2 WHERE "RequestID" = $3'
        const result1 = await db.query(query1, [1, 1, requestID]);

        const getPetName = 'SELECT "Name" FROM "Pet" WHERE "PetID" = $1';
        const petNameResult = await db.query(getPetName, [updateResult.rows[0].PetID]);
        const description = petNameResult.rows[0].Name;

        const applierID = updateResult.rows[0].ApplierID;
        const ownerID = updateResult.rows[0].OwnerID;
        const petID = updateResult.rows[0].PetID;
        console.log({ applierID, ownerID, petID });

        const query2 = 'UPDATE "Pet" SET "UserID" = $1 WHERE "UserID" = $2 AND "PetID" = $3' ;
        const result2 = await db.query(query2, [applierID, ownerID, updateResult.rows[0].PetID]);


        var dateNow = Date.now();
        var dateStr = dateNow.getDate() + "-" + dateNow.getMonth() + "-" + dateNow.getFullYear();
        const getUserIDs = `SELECT "ApplierID" FROM "AdoptionRequests" WHERE "ApplierID"!=$1 AND "PetID"=$2`;
        const userIDResults = await db.query(getUserIDs, [applierID, updateResult.rows[0].PetID]);

        // const updateOthersDisable = `UPDATE "AdoptionRequests" SET "Disable"=$1 WHERE "ApplierID"!=$2 AND "PetID"=$3`;
        // const updateOtherDisablesResult = await db.query(getUserIDs, [1,applierID,updateResult.rows[0].PetID]); 


        //^---- Send congratulations msg to the one who got his pet accepted
        var str = "Congratulations, your request for adopting " + description + " has been approved, Date:  " + dateStr;
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [applierID, str, 0]);

        //^---- Send notification to all others who didn't get their request accepted
        for (const user of userIDResults.rows) {
            const query4 = 'UPDATE "AdoptionRequests" SET "Disable" = $1 WHERE "ApplierID" = $2 AND "PetID" = $3';
            const result4 = await db.query(query4, [1, user.ApplierID, updateResult.rows[0].PetID]);

            const query5 = 'UPDATE "AdoptionRequests" SET "AcceptStatus" = $1 WHERE "ApplierID" = $2 AND "PetID" = $3';
            const result5 = await db.query(query5, [0, user.ApplierID, updateResult.rows[0].PetID]);

            var str = "Unfortunately, your request for adopting " + description + " has been declined, Date: " + dateStr;
            const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
            // Here user.UserID should match how the UserID is named in your User table
            await db.query(notificationInsertQuery, [user.ApplierID, str, 0]);
        }


        //^---- NEEd to do work of updating ther adoption table

        // If the update was successful, send a success response
        res.status(200).json({ message: 'Getting all the notifications', result: updateResult.rows });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


const rejectAdoptionMessage = async (req, res) => {
    try {
        const { requestID } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        // if (!UserID || !PetID || !URL) {
        //     return res.status(400).json({ message: 'Missing required fields: UserID, PetID, and URL are all required.' });
        // }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'SELECT * FROM "AdoptionRequests" WHERE "RequestID" = $1';
        const updateResult = await db.query(updateQuery, [requestID]);


        //^----- For enabling the Read Status after viewing one time
        // const readStatusQuery = 'UPDATE "Notification" SET "ReadStatus" = 1';
        // const updated = await db.query(readStatusQuery);

        // Check if the update was successful (i.e., if any row was actually updated)
        // if (updateResult.rowCount === 0) {
        //     // No rows were updated, which means no matching pet was found
        //     return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        // }

        const query1 = 'UPDATE "AdoptionRequests" SET "AcceptStatus" = $1 , "Disable" = $2 WHERE "RequestID" = $3'
        const result1 = await db.query(query1, [0, 1, requestID]);

        const applierID = updateResult.rows[0].ApplierID;
        const ownerID = updateResult.rows[0].OwnerID;
        const petID = updateResult.rows[0].PetID;
        console.log({ applierID, ownerID, petID });

        // const query2 = 'UPDATE "Pet" SET "UserID" = $1 WHERE "UserID" = $2';
        // const result2 = await db.query(query2, [applierID, ownerID]);

        //^---- NEEd to do work of updating ther adoption table

        // If the update was successful, send a success response
        res.status(200).json({ message: 'Getting all the notifications', result: updateResult.rows });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const giveAdoption = async (req, res) => {
    try {
        const { petID, userID } = req.body; // Extract petID from request body

        // Update the Pet table to set the AdoptionStatus for the specified PetID
        const updateQuery = 'UPDATE "Pet" SET "AdoptionStatus" = 2 WHERE "PetID" = $1';
        const updateResult = await db.query(updateQuery, [petID]);

        new Date();
        var dateNow = Date.now();
        // var str = "Your Donation request has been posted , Title: " + description + ", Time:  " + dateNow ;

        const adoptionInsertQuery = 'INSERT INTO "Adoption" ("PetID", "UserID", "AdoptionDate", "Status") VALUES ($1, $2,CURRENT_DATE, $3) RETURNING "AdoptionID"';
        const adoptionInsertResult = await db.query(adoptionInsertQuery, [petID, userID, 2]);

        const adoptionID = adoptionInsertResult.rows[0].AdoptionID;

        const forumQuery = 'INSERT INTO "PostTable" ("Type","OtherID") VALUES ($1,$2)';
        const forumResult = await db.query(forumQuery, [2, adoptionID]);

        const petQuery = 'SELECT "Type", "Breed" FROM "Pet" WHERE "PetID" = $1';
        const petResult = await db.query(petQuery, [petID]);
        const petType = petResult.rows[0].Type;
        const petBreed = petResult.rows[0].Breed;

        const wishlistQuery = 'SELECT "UserID" FROM "Wishlist" WHERE "PetType" = $1 AND "Breed" = $2';
        const wishlistResult = await db.query(wishlistQuery, [petType, petBreed]);
        const wishlistUsers = wishlistResult.rows;

        for (let i = 0; i < wishlistUsers.length; i++) {
            console.log("Yes");
            const notificationQuery = 'INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3)';
            const notificationResult = await db.query(notificationQuery, [wishlistUsers[i].UserID, "A pet of your wishlist has been added for adoption", 0]);
        }

        res.status(200).json({ message: 'Pet adoption status updated successfully.' });
    } catch (error) {
        console.error('Error updating pet adoption status:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const getMessages = async (req, res) => {
    try {
        const { userID } = req.body; // Extract UserID from request body

        const query = `
        SELECT 
            u."Username", 
            ar.*,
            p."Name" 
        FROM 
            "AdoptionRequests" ar
        JOIN 
            "User" u ON ar."ApplierID" = u."UserID"
        JOIN
            "Pet" p ON ar."PetID" = p."PetID"    
        WHERE 
            ar."OwnerID" = $1
        `;

        const result = await db.query(query, [userID]);
        res.status(200).json({ message: 'Getting all the Adoption Requests', result: result.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const rescuerApply = async (req, res) => {
    try {
        // Extracting all the necessary fields from the request body
        const { userID, adultStatus, petOwnStatus, experience } = req.body;

        // SQL query for inserting data into the RescuerApplications table
        const getNameQuery = 'SELECT "Username" FROM "User" WHERE "UserID" = $1';
        const nameResult = await db.query(getNameQuery, [userID]);
        const name = nameResult.rows[0].Username;

        const insertQuery = `
            INSERT INTO "RescuerApplications" ("UserID", "AdultStatus", "PetOwnStatus", "Experience", "ApprovalStatus", "Name")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *; 
        `;

        // Parameters for the SQL query
        const values = [userID, adultStatus, petOwnStatus, experience, 2, name];

        // Executing the SQL query
        const result = await db.query(insertQuery, values);

        // Sending the inserted data back to the client
        res.status(200).json({ message: 'Application submitted successfully', application: result.rows[0] });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const pictureRescuer = async (req, res) => {
    try {
        const { UserID, URL } = req.body; // Extract UserID, PetID, and URL from request body

        // Verify that all required fields are provided
        if (!UserID || !URL) {
            return res.status(400).json({ message: 'Missing required fields: UserID, and URL are all required.' });
        }

        // Update the Pet table to set the URL for the specified PetID and UserID
        const updateQuery = 'UPDATE "RescuerApplications" SET "URL" = $1 WHERE "UserID" = $2';
        const updateResult = await db.query(updateQuery, [URL, UserID]);

        // Check if the update was successful (i.e., if any row was actually updated)
        if (updateResult.rowCount === 0) {
            // No rows were updated, which means no matching pet was found
            return res.status(404).json({ message: 'No matching pet found for the given UserID and PetID.' });
        }

        // If the update was successful, send a success response
        res.status(200).json({ message: 'ID picture updated successfully.' });

    } catch (error) {
        console.error('Error updating pet picture:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//^---- Show all the vet informations
const getAllVets = async (req, res) => {
    try {
        // Define the SQL query to join VetInfo with VetAppointments and aggregate booked slots
        const query = `
            SELECT 
                "VetInfo"."ID", 
                "VetInfo"."UserID", 
                "VetInfo"."Name",
                "VetInfo"."Expertise", 
                "VetInfo"."StartTime", 
                "VetInfo"."EndTime",
                "VetInfo"."Location",
                "VetInfo"."URL",
                COALESCE(json_agg(json_build_object('BookedSlots', "VetAppointments"."BookedSlots")) FILTER (WHERE "VetAppointments"."BookedSlots" IS NOT NULL), '[]') AS "BookedSlots"
            FROM 
                "VetInfo"
            LEFT JOIN 
                "VetAppointments" ON "VetInfo"."ID" = "VetAppointments"."VetID"
            GROUP BY 
                "VetInfo"."ID";
        `;

        // Execute the query
        const result = await db.query(query);

        // Send the result back to the client
        res.status(200).json({ message: 'Vets fetched successfully', data: result.rows });
    } catch (error) {
        console.error('Error fetching vet information:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}


//^---- Get the informations and slots of a specific vet
const getSpecificVet = async (req, res) => {
    try {
        const { vetID } = req.body; // Extract vetID from request body

        const query = `
            SELECT 
                "VetInfo"."ID", 
                "VetInfo"."UserID", 
                "VetInfo"."Name",
                "VetInfo"."Expertise", 
                "VetInfo"."StartTime", 
                "VetInfo"."EndTime",
                "VetAppointments"."Date",
                COALESCE(json_agg(json_build_object('BookedSlots', "VetAppointments"."BookedSlots") ORDER BY "VetAppointments"."Date") FILTER (WHERE "VetAppointments"."BookedSlots" IS NOT NULL), '[]') AS "BookedSlotsInfo"
            FROM 
                "VetInfo"
            LEFT JOIN 
                "VetAppointments" ON "VetInfo"."ID" = "VetAppointments"."VetID"
            WHERE 
                "VetInfo"."ID" = $1
            GROUP BY 
                "VetInfo"."ID", "VetInfo"."UserID", "VetInfo"."Name", "VetInfo"."Expertise", "VetInfo"."StartTime", "VetInfo"."EndTime", "VetAppointments"."Date"
            ORDER BY 
                "VetAppointments"."Date";
        `;

        const result = await db.query(query, [vetID]);

        if (result.rows.length > 0) {
            res.status(200).json({ slots: result.rows });
        } else {
            res.status(404).json({ message: 'No vet found for the given vet ID' });
        }
    } catch (error) {
        console.error('Error fetching vet information:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getEvenMoreSpecificVet = async (req, res) => {
    try {
        const { vetID, date } = req.body; // Extract vetID from request body

        const query = `
            SELECT 
                "VetInfo"."ID", 
                "VetInfo"."UserID", 
                "VetInfo"."Name",
                "VetInfo"."Expertise", 
                "VetInfo"."StartTime", 
                "VetInfo"."EndTime",
                "VetAppointments"."Date",
                COALESCE(json_agg(json_build_object('BookedSlots', "VetAppointments"."BookedSlots") ORDER BY "VetAppointments"."Date") FILTER (WHERE "VetAppointments"."BookedSlots" IS NOT NULL), '[]') AS "BookedSlotsInfo"
            FROM 
                "VetInfo"
            LEFT JOIN 
                "VetAppointments" ON "VetInfo"."ID" = "VetAppointments"."VetID"
            WHERE 
                "VetInfo"."ID" = $1 AND "VetAppointments"."Date" = date
            GROUP BY 
                "VetInfo"."ID", "VetInfo"."UserID", "VetInfo"."Name", "VetInfo"."Expertise", "VetInfo"."StartTime", "VetInfo"."EndTime", "VetAppointments"."Date"
            ORDER BY 
                "VetAppointments"."Date";
        `;

        const result = await db.query(query, [vetID]);

        if (result.rows.length > 0) {
            res.status(200).json({ slots: result.rows });
        } else {
            res.status(404).json({ message: 'No vet found for the given vet ID' });
        }
    } catch (error) {
        console.error('Error fetching vet information:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const applyForVet = async (req, res) => {
    try {
        // Extract data from request body
        const { userID, vetID, requestedSlot, date, problemDescription, petName } = req.body;

        // Create a new entry in the VetRequests table
        const query = `
            INSERT INTO "VetRequests" ("UserID", "VetID", "RequestedSlot", "Date", "ProblemDescription", "Status")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;`; // This line ensures that the inserted row is returned

        // Assuming db is your database connection variable
        const result = await db.query(query, [userID, vetID, requestedSlot, date, problemDescription, 1]);



        const insertIntoVetAppointments = `INSERT INTO "VetAppointments" ("VetID", "BookedSlots", "Date", "PetName") VALUES ($1, $2, $3, $4) RETURNING *`;
        const result2 = await db.query(insertIntoVetAppointments, [vetID, requestedSlot, date, petName]);

        const getVetName = `SELECT "Name" FROM "VetInfo" WHERE "ID" = $1`;
        const result1 = await db.query(getVetName, [vetID]);
        const vetName = result1.rows[0].Name;

        var str = "Your Appointment has been booked with " + vetName + ", at Date: " + date + ", on the slot: " + requestedSlot;
        const notificationInsertQuery = `INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [userID, str, 0]);

        // Sending the inserted data back to the client
        res.status(200).json({ message: 'Application submitted successfully', application: result.rows[0] });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const getOwnVetAppointments = async (req, res) => {
    try {
        const { userID } = req.body; // Extract UserID from request body

        const query = `
        SELECT 
            "VetRequests"."ReqID",
            "VetRequests"."VetID",
            "VetRequests"."UserID",
            "VetRequests"."RequestedSlot",
            "VetRequests"."Date",
            "VetRequests"."ProblemDescription",
            "VetRequests"."Status",
            "VetInfo"."Name" AS "VetName",
            "VetInfo"."Location" AS "Location"
        FROM 
            "VetRequests"
        JOIN 
            "VetInfo" ON "VetRequests"."VetID" = "VetInfo"."ID"
        WHERE 
            "VetRequests"."UserID" = $1
        `;

        const result = await db.query(query, [userID]);
        res.status(200).json({ message: 'Getting all the vet appointments', result: result.rows });
    } catch (error) {
        console.error('Error fetching vet appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

const viewAllRescuers = async (req, res) => {
    try {
        // Extract data from request body


        // Create a new entry in the VetRequests table
        const query = `
            SELECT * FROM "User" WHERE "Type" = $1`; // This line ensures that the inserted row is returned

        // Assuming db is your database connection variable
        const result = await db.query(query, [1]);


        // Sending the inserted data back to the client
        res.status(200).json({ message: 'List of all the rescuers', application: result.rows });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



const scheduleVaccine = async (req, res) => {
    try {
        //^---- Get petId from the frontent
        const { petID } = req.body;
        // console.log(petID);
        // console.log(petID.Type);

        //^---- Get the type of the pet
        const query1 = `SELECT "Type" FROM "Pet" WHERE "PetID" = $1`;
        const result1 = await db.query(query1, [petID]);

        const petType = result1.rows[0].Type;
        console.log(petType);


        //^---- Get the type of vaccines applicable for that pet type
        const query2 = `SELECT "VaccinationID","Name","Description"  FROM "Vaccination" WHERE "PetsType" = $1`;
        const result2 = await db.query(query2, [petType]);





        // Sending the inserted data back to the client
        res.status(200).json({ message: 'List of all the eligible vaccinations', application: result2.rows });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const addToVaccineSchedule = async (req, res) => {

    try {
        const { petID, userID, dose, interval, vaccineName } = req.body;

        const query1 = `INSERT INTO "VaccineAppointments" ("PetID", "UserID", "Dose", "CompletedDose", "Interval", "VaccineName", "Status") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await db.query(query1, [petID, userID, dose, 0, interval, vaccineName, 0]);

        const getPetName = `SELECT "Name" FROM "Pet" WHERE "PetID" = $1`;
        const result2 = await db.query(getPetName, [petID]);
        const petName = result2.rows[0].Name;

        //^---- Add to the vaccine notifications
        const dateNow = new Date();
        var dateStr = dateNow.getDate() + "-" + dateNow.getMonth() + "-" + dateNow.getFullYear();

        var shortMsg = vaccineName + " (0/ " + dose + ")";

        var str = "The Vaccine Schedule" + vaccineName + " for your pet " + petName + " has been added to your schedule list. Date: " + dateStr + ". Dosage Number: " + dose;
        const notificationInsertQuery = `INSERT INTO "VaccinationMessages" ("PetID", "Message", "Status", "ShortMsg", "Date") VALUES ($1, $2, $3,$4, $5) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [petID, str, 0, shortMsg, dateStr]);

        res.status(200).json({ message: 'Vaccine scheduled successfully', application: result.rows[0] });

    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}


//^---- View all the scheduled vaccines
const viewAllScheduledVaccines = async (req, res) => {
    try {
        const { userID } = req.body; // Extract UserID from request body

        const query = `
        SELECT 
            "VaccineAppointments"."ID",
            "VaccineAppointments"."PetID",
            "VaccineAppointments"."UserID",
            "VaccineAppointments"."Dose",
            "VaccineAppointments"."CompletedDose",
            "VaccineAppointments"."Interval",
            "VaccineAppointments"."VaccineName",
            "VaccineAppointments"."Status",
            "Pet"."Name" AS "PetName"
        FROM 
            "VaccineAppointments"
        JOIN 
            "Pet" ON "VaccineAppointments"."PetID" = "Pet"."PetID"
        WHERE 
            "VaccineAppointments"."UserID" = $1 AND "VaccineAppointments"."Dose" > "VaccineAppointments"."CompletedDose"
        `;

        const result = await db.query(query, [userID]);
        res.status(200).json({ message: 'Getting all the scheduled vaccines', result: result.rows });
    } catch (error) {
        console.error('Error fetching scheduled vaccines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

//^---- Get the specific vaccination schedule
const getSpecificVaccinationSchedule = async (req, res) => {
    try {
        const { id } = req.body; // Extract UserID from request body

        const query = `
        SELECT 
            "VaccineAppointments"."ID",
            "VaccineAppointments"."PetID",
            "VaccineAppointments"."UserID",
            "VaccineAppointments"."Dose",
            "VaccineAppointments"."CompletedDose",
            "VaccineAppointments"."Interval",
            "VaccineAppointments"."VaccineName",
            "VaccineAppointments"."Status",
            "Pet"."Name" AS "PetName"
        FROM 
            "VaccineAppointments"
        JOIN 
            "Pet" ON "VaccineAppointments"."PetID" = "Pet"."PetID"
        WHERE 
            "VaccineAppointments"."ID" = $1
        `;

        const result = await db.query(query, [id]);
        res.status(200).json({ message: 'Getting all the scheduled vaccines', result: result.rows });
    } catch (error) {
        console.error('Error fetching scheduled vaccines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

//^---- Increment the dose of the vaccine
const incrementDose = async (req, res) => {
    try {
        const { appointmentID } = req.body; // Extract UserID from request body

        const query = `
        UPDATE "VaccineAppointments" SET "CompletedDose" = "CompletedDose" + 1 WHERE "ID" = $1
        `;
        const result = await db.query(query, [appointmentID]);


        //^---- Get all necessary info for the notification message
        const query2 = `SELECT * FROM "VaccineAppointments" WHERE "ID" = $1`;
        const result2 = await db.query(query2, [appointmentID]);
        const petID = result2.rows[0].PetID;
        const userID = result2.rows[0].UserID;
        const vaccineName = result2.rows[0].VaccineName;
        const dateNow = new Date();
        const completedDose = result2.rows[0].CompletedDose;
        const totalDose = result2.rows[0].Dose;

        //^---- Get the current date
        var dateStr = dateNow.getDate() + "-" + dateNow.getMonth() + "-" + dateNow.getFullYear();

        const getPetName = `SELECT "Name" FROM "Pet" WHERE "PetID" = $1`;
        const result3 = await db.query(getPetName, [petID]);
        const petName = result3.rows[0].Name;


        //^---- Inserting into the vaccineNotifications table
        var shortMsg = vaccineName + " (" + completedDose + "/ " + totalDose + ")";
        var str = "The Vaccine " + vaccineName + " was administered to your pet " + petName + " on " + dateStr + ". Dosage Number: " + completedDose + ", remaining doses: ";
        const notificationInsertQuery = `INSERT INTO "VaccinationMessages" ("PetID", "Message", "Status", "ShortMsg", "Date") VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const userResult = await db.query(notificationInsertQuery, [petID, str, 0, shortMsg, dateStr]);

        if (completedDose == totalDose) {
            const str2 = "The Vaccine " + vaccineName + " has been completed for your pet " + petName + " on " + dateStr;
            const userResult2 = await db.query(notificationInsertQuery, [petID, str2, 0]);
        }

        res.status(200).json({ message: 'Dose incremented successfully', notification: userResult.rows });


    } catch (error) {
        console.error('Error fetching scheduled vaccines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}


const viewAllVaccineMessages = async (req, res) => {
    try {
        const { petID } = req.body; // Extract UserID from request body

        const query = `
        SELECT 
            "VaccinationMessages"."ShortMsg",
            "VaccinationMessages"."Date",
            "Pet"."Name" AS "PetName"
        FROM 
            "VaccinationMessages"
        JOIN 
            "Pet" ON "VaccinationMessages"."PetID" = "Pet"."PetID"
        WHERE 
            "VaccinationMessages"."PetID" = $1
        `;

        const result = await db.query(query, [petID]);
        res.status(200).json({ message: 'Getting all the scheduled vaccines', result: result.rows });
    } catch (error) {
        console.error('Error fetching scheduled vaccines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

const wishlist = async (req, res) => {
    try {
        const { userID } = req.body; // Extract UserID from request body

        const query = `SELECT * FROM "Wishlist" WHERE "UserID" = $1`;
        const result = await db.query(query, [userID]);
        res.status(200).json({ message: 'Getting all the Wishlist', result: result.rows });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const addWishlist = async (req, res) => {
    try {
        const { userID, petType, breed } = req.body; // Extract UserID, PetType, and Breed from request body
        const query = `INSERT INTO "Wishlist" ("UserID", "PetType", "Breed") VALUES ($1, $2, $3) RETURNING *`;
        const result = await db.query(query, [userID, petType, breed]);

        const petQuery = 'SELECT "PetID" FROM "Pet" WHERE "Type" = $1 AND "Breed" = $2 AND "AdoptionStatus" = 2';
        const petResult = await db.query(petQuery, [petType, breed]);

        if (petResult.rows.length > 0) {
            const wishlistQuery = 'SELECT "UserID" FROM "Wishlist" WHERE "PetType" = $1 AND "Breed" = $2';
            const wishlistResult = await db.query(wishlistQuery, [petType, breed]);
            const wishlistUsers = wishlistResult.rows;
            for (let i = 0; i < wishlistUsers.length; i++) {
                console.log("Yes");
                const notificationQuery = 'INSERT INTO "Notification" ("UserID", "Comments", "ReadStatus") VALUES ($1, $2, $3)';
                const notificationResult = await db.query(notificationQuery, [wishlistUsers[i].UserID, "A pet of your wishlist has been added for adoption", 0]);
            }
        }

        res.status(200).json({ message: 'Wishlist added successfully', result: result.rows });
    }
    catch (error) {
        console.error('Error adding wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { viewAllVaccineMessages, getEvenMoreSpecificVet, getOwnVetAppointments, incrementDose, getSpecificVet, getSpecificVaccinationSchedule, viewAllScheduledVaccines, addToVaccineSchedule, scheduleVaccine, viewAllRescuers, getAllVets, applyForVet, showAllUserData, rescuerApply, addPet, editUserProfile, removePet, picturePet, showNotifications, showMessages, acceptAdoptionMessage, rejectAdoptionMessage, giveAdoption, getMessages, pictureRescuer, wishlist, addWishlist };
