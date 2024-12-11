// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
  if (!token) return res.sendStatus(401); // No token found

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token verification failed
    req.user = user; // Attach user payload to request
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = { authenticateToken };
