// middleware/authMiddleware.js
const jwt= require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "TFYUG67T67T762";

const authMiddleware = (req, res, next) => {
  let token;

  // 1. Check Authorization header (preferred)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Or check cookies if token stored in cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // 3. If no token found
  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  // 4. Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports= authMiddleware;
