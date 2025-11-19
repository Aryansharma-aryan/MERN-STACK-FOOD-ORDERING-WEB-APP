// middleware/AdminMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "TFYUG67T67T762";

const isAdmin = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from Authorization header (preferred)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Or from cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ If token missing → unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized! Token missing.",
      });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 5️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select("role name email");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 6️⃣ Check role
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied! Admins only.",
      });
    }

    // 7️⃣ Attach user to req for future use
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = isAdmin;
