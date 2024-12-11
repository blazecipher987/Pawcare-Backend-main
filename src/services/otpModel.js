// otpModel.js
const db = require('../database/dbconnection'); // Your database connection

async function storeOTP(email, otp, username, password, role, address, phoneNumber) {
    const createdAt = new Date();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5); // OTP expires after 5 minutes
    const query = `INSERT INTO "OTP" (
        "Email",
        "OTP",
        "CreatedAt",
        "ExpiresAt",
        "Username",
        "Password",
        "Role",
        "Address",
        "PhoneNumber"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`; // Add the rest of the columns
    await db.query(query, [email, otp, createdAt, expiry, username, password, role, address, phoneNumber]);
}

async function verifyOTP(email, otp) {
    const query = `SELECT * FROM "OTP" WHERE "Email" = $1 AND "OTP" = $2`;
    const result = await db.query(query, [email, otp]);
    if (result.rows.length === 0) {
        return false; // OTP not found
    }
    const record = result.rows[0];
    const currentTimestamp = new Date();
    if (currentTimestamp > record.ExpiresAt) {
        return false; // OTP expired
    }
    // Optionally, delete the OTP after verification to prevent reuse
    const deleteQuery = `DELETE FROM "OTP" WHERE "Email" = $1`;
    await db.query(deleteQuery, [email]);
    return true; // OTP is valid
}

module.exports = {
    storeOTP,
    verifyOTP
};
