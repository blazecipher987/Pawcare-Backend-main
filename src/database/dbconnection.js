const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Create a pool to manage database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from your .env file
});

module.exports = {
  query: (text, params) => pool.query(text, params), // Helper function to run queries
};
