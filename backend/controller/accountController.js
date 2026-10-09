const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { credentials } = require("../utils/validation");

function createAccounts(UserModel = User) {
  function reply(res, user, status = 200) {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    return res.status(status).json({ token, userId: user._id, role: user.role, message: status === 201 ? "Account created." : "Login successful." });
  }
  const wrap = fn => async (req, res, next) => {
    try {
      if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is unavailable." });
      await fn(req, res);
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ message: error.message });
      if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists. Please log in." });
      next(error);
    }
  };
  return {
    signup: wrap(async (req, res) => {
      const { name, email, password } = credentials(req.body, true);
      if (await UserModel.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists. Please log in." });
      const user = await UserModel.create({ name, email, password: await bcrypt.hash(password, 12), role: "user" });
      reply(res, user, 201);
    }),
    loginUser: wrap(async (req, res) => {
      const { email, password } = credentials(req.body);
      const user = await UserModel.findOne({ email });
      if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: "Email or password is incorrect." });
      reply(res, user);
    }),
  };
}
module.exports = { ...createAccounts(), createAccounts };
