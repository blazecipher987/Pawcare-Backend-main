const db = require("../database/dbconnection"); // Your setup for the PostgreSQL connection
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const otpService = require('../services/otpService'); //! NEw edition for email verification


const handleRegister = async (req, res) => {
  try {
    //^---- Got from the Frontend
    const { username, email, password, role, address, phoneNumber} = req.body;

    //^---- Duplication Checking in User and LoginInfo tables
    const userCheckQuery =
      'SELECT * FROM "User" WHERE "Email" = $1 OR "Username" = $2';
    const loginInfoCheckQuery = 'SELECT * FROM "LoginInfo" WHERE "Email" = $1';
    // const existingUser = await db.query(userCheckQuery, [email, username]);
    const existingLoginInfo = await db.query(loginInfoCheckQuery, [email]);

    if (existingLoginInfo.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    //!---- Change Begins here
    if (existingLoginInfo.rows.length === 0) {
      // Send OTP to user's email
      await otpService.requestOTP(email,username, password, role, address, phoneNumber);

      // Send response to indicate OTP has been sent
      return res
        .status(200)
        .json({
          message: "OTP sent to email. Please verify to complete registration.",
        });
    } else {
      return res.status(400).json({ message: "User already exists" });
    }

    // //^---- Insert new user into the User table
    // const userInsertQuery =
    //   'INSERT INTO "User" ("Username", "Email", "Role", "Address") VALUES ($1, $2, $3, $4) RETURNING *';
    // const userResult = await db.query(userInsertQuery, [
    //   username,
    //   email,
    //   role,
    //   address,
    // ]);
    // const newUser = userResult.rows[0];

    // //^---- Hash the password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // //^---- Insert login info into the LoginInfo table
    // const loginInfoInsertQuery =
    //   'INSERT INTO "LoginInfo" ("Email", "UserID", "Password", "Type") VALUES ($1, $2, $3, $4)';
    // await db.query(loginInfoInsertQuery, [
    //   email,
    //   newUser.UserID,
    //   hashedPassword,
    //   "0",
    // ]); // Assuming '0' is the type for regular users

    // //^---- Return the new user (excluding sensitive information)
    // delete newUser.Password;
    // const token = jwt.sign(
    //   { userId: newUser.UserID, username: newUser.Username },
    //   secretKey,
    //   { expiresIn: "1h" }
    // );
    // res.status(201).json({ newUser, token }); // Send the new user data and token back
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


//!---- Extra function for completing registration after OTP matches
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body; // username, password, role, and address are now fetched from the OTP record

        // Verify OTP
        const otpVerificationQuery = `SELECT * FROM "OTP" WHERE "Email" = $1 AND "OTP" = $2 AND "ExpiresAt" > NOW()`;
        const otpResult = await db.query(otpVerificationQuery, [email, otp]);

        if (otpResult.rows.length === 0) {
            return res.status(500).json({ message: 'Invalid OTP or OTP expired' });
        }

        // Extract user details from the OTP record
        const { Username, Password, Role, Address, PhoneNumber } = otpResult.rows[0];

        // Insert new user into the User table
        const userInsertQuery = `INSERT INTO "User" ("Username", "Email", "Role", "Address", "PhoneNumber", "Type") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const userResult = await db.query(userInsertQuery, [Username, email, Role, Address, PhoneNumber, 0]);
        const newUser = userResult.rows[0];

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        // Insert login info into the LoginInfo table
        const loginInfoInsertQuery = `INSERT INTO "LoginInfo" ("Email", "UserID", "Password", "Type", "Approval") VALUES ($1, $2, $3, $4, $5)`;
        await db.query(loginInfoInsertQuery, [email, newUser.UserID, hashedPassword, Role, 1]); // Here, Role is used directly assuming it matches the expected values for Type

        // Delete the OTP record after successful verification
        const deleteOTPQuery = `DELETE FROM "OTP" WHERE "Email" = $1`;
        await db.query(deleteOTPQuery, [email]);

        // Return the new user (excluding sensitive information like password)
        delete newUser.Password;
        const token = jwt.sign({ userId: newUser.UserID, username: Username }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ newUser, token }); // Send the new user data and token back

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
  handleRegister,verifyOTP
};
