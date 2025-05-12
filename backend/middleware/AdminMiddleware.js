const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = "TFYUG67T67T762"; 

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Get token from the request cookies or headers
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided. Unauthorized!" });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden! You do not have admin rights." });
    }

    // Attach user to the request object for future use
    req.user = user;
    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = isAdmin;
