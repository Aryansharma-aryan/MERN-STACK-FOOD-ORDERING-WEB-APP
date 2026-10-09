module.exports = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Please log in." });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access is required." });
  next();
};
