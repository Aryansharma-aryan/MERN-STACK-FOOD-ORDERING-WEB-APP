// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

// Use environment variable or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || "TFYUG67T67T762";

const authMiddleware = (req, res, next) => {
  let token;

  // 1️⃣ Check "Authorization: Bearer <token>" header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2️⃣ Or check cookies if token stored in cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // 3️⃣ No token → Unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token is missing.",
    });
  }

  try {
    // 4️⃣ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;
