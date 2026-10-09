const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is unavailable." });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!mongoose.isValidObjectId(decoded.id)) throw new Error("Invalid user");
  } catch { return res.status(401).json({ message: "Your session has expired. Please log in again." }); }
  try {
    const user = await User.findById(decoded.id).select("role name").lean();
    if (!user) return res.status(401).json({ message: "Account not found. Please log in again." });
    req.user = { id: String(user._id), role: user.role, name: user.name };
    next();
  } catch (error) { next(error); }
};
