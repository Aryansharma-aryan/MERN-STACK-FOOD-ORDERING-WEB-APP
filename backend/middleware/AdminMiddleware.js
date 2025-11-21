const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "TFYUG67T67T762";

const isAdmin = async (req, res, next) => {
  try {
    // Token can come from Authorization header or cookies
    const token =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized! Token missing." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.id).select("role name email");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied! Admins only." });
    }

    // Attach user info
    req.user = { id: user._id, role: user.role, name: user.name };
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = isAdmin;
