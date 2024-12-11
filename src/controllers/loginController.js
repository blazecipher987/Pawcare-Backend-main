// controllers/loginController.js
const db = require('../database/dbconnection'); // Your setup for the PostgreSQL connection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const handleLogin = async (req, res) => {
    try {
        //&-- For debugging purpose (REMOVE LATER)
        console.log('Request body:', req.body);

        const { email, password } = req.body; // Get email and password from request body

        // Fetch login info from the LoginInfo table s
        const loginInfoQuery = 'SELECT * FROM "LoginInfo" WHERE "Email" = $1 AND "Approval"=1';
        const loginInfoResult = await db.query(loginInfoQuery, [email]);

        const getUserType = 'SELECT "Type" FROM "User" WHERE "Email" = $1';
        const userType = await db.query(getUserType, [email]);
        const type = userType.rows[0].Type;
        console.log(type);

        
        if (loginInfoResult.rows.length === 0) {
            return res.status(401).json({ message: 'Email not found' });
        }

        const loginInfo = loginInfoResult.rows[0];

        // Compare the hashed password
        const isMatched = await bcrypt.compare(password, loginInfo.Password);

        if (!isMatched) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if(type==2){
            const getVetID = 'SELECT "ID" FROM "VetInfo" WHERE "UserID" = $1';
            const vetID = await db.query(getVetID, [loginInfo.UserID]);
            const vetid = vetID.rows[0].ID;
            
            return res.status(200).json({ message: 'Hello Vet' ,userID: loginInfo.UserID, 
            email : loginInfo.Email, vetid: vetid , type: type});
        }


        // Generate a token for authentication
        const token = jwt.sign(
            { 
                userId: loginInfo.UserID, 
                email: loginInfo.Email
               
            }, 
            secretKey, 
            { expiresIn: '1h' }
        );

        // Send the UserID and token back
        res.status(200).json({
            message: 'Login successful', 
            userID: loginInfo.UserID, 
            email : loginInfo.Email, 
            type: type,
            
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { handleLogin };
