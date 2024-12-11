// controllers/loginController.js
const db = require("../database/dbconnection"); // Your setup for the PostgreSQL connection
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;

const showAllForumPosts = async (req, res) => {
  try {
    // SQL Query to fetch posts of Type 1, and join with Donation and User to get required information
    const query = `
        SELECT 
    p."PostID", 
    u."UserID", 
    u."Username",
    p."Type", 
    d."Description", 
    d."DonationID", 
    d."TotalAmount", 
    d."RequestDate", 
    u."Address",
    u."Email",
    json_agg(json_build_object('ReplyID', r."ReplyID", 'ReplyText', r."Text", 'ReplierUserID', r."UserID", 'ReplierUserName', ru."Username")) AS Replies
FROM 
    "PostTable" p 
JOIN 
    "Donation" d ON p."OtherID" = d."DonationID"
JOIN 
    "User" u ON d."UserID" = u."UserID"
LEFT JOIN 
    "ReplyTable" r ON p."PostID" = r."PostID"
LEFT JOIN 
    "User" ru ON r."UserID" = ru."UserID"
WHERE 
    p."Type" = 1
GROUP BY 
    p."PostID", u."UserID", d."Description", d."DonationID", d."TotalAmount", d."RequestDate", u."Address",u."Email";


    
        `;

        const query2 = `
        SELECT 
    p."PostID", 
    u."UserID", 
    u."Username",
    p."Type", 
    a."AdoptionID", 
    a."PetID",
    q."Name",
    a."AdoptionDate", 
    u."Address",
    u."Email",
    json_agg(json_build_object('ReplyID', r."ReplyID", 'ReplyText', r."Text", 'ReplierUserID', r."UserID", 'ReplierUserName', ru."Username")) AS Replies
FROM 
    "PostTable" p 
JOIN 
    "Adoption" a ON p."OtherID" = a."AdoptionID"
JOIN 
    "User" u ON a."UserID" = u."UserID"
JOIN
    "Pet" q ON q."PetID" = a."PetID"
LEFT JOIN 
    "ReplyTable" r ON p."PostID" = r."PostID"
LEFT JOIN 
    "User" ru ON r."UserID" = ru."UserID"
WHERE 
    p."Type" = 2
GROUP BY 
    p."PostID", u."UserID", a."AdoptionID", a."PetID", q."Name", a."AdoptionDate", u."Address", u."Email";


    
        `;

    

        const query3 = `
        SELECT 
    p."PostID", 
    p."Text",
    p."UserID",
    p."Type", 
    u."Username",
    u."Email",
    u."Address",
    json_agg(json_build_object('ReplyID', r."ReplyID", 'ReplyText', r."Text", 'ReplierUserID', r."UserID", 'ReplierUserName', ru."Username")) AS Replies
FROM 
    "PostTable" p
JOIN 
    "User" u ON p."UserID" = u."UserID"
LEFT JOIN 
    "ReplyTable" r ON p."PostID" = r."PostID"
LEFT JOIN 
    "User" ru ON r."UserID" = ru."UserID"
WHERE 
    p."Type" = 0
GROUP BY 
    p."PostID", p."Text", p."UserID", u."Username",u."Email", u."Address";


    
        `;


    // Execute the query
    const result = await db.query(query);
    const result2 = await db.query(query2);
    const result3 = await db.query(query3);

    const allData = result.rows.concat(result2.rows, result3.rows);


    // Send the result as a response
    res.status(200).json({
      status: "success",
      donationData: allData,
    });
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const addReply = async (req, res) => {
    try {
        const { postID, userID, text } = req.body; // Get userID from request parameters

        // Fetch user details from the database
        const userQuery = 'INSERT INTO "ReplyTable" ("PostID", "UserID", "Text") VALUES ($1, $2, $3);';
        const userResult = await db.query(userQuery, [postID, userID, text]);

        // if (userResult.rows.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }

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


const addPost = async (req, res) => {
    try {
        const {userID, text } = req.body; // Get userID from request parameters

        // Fetch user details from the database
        const userQuery = 'INSERT INTO "PostTable" ("Type","UserID", "Text") VALUES ($1, $2, $3);';
        const userResult = await db.query(userQuery, [0,userID, text]);

        // if (userResult.rows.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }

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

module.exports = { showAllForumPosts , addReply, addPost};
