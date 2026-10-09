const mongoose = require("mongoose");
const crypto = require("crypto");
const schema = new mongoose.Schema({ _id: String, count: Number, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Attempts = mongoose.model("AuthAttempt", schema);
function createAuthLimit(Model = Attempts) {
  return async (req, res, next) => {
    if (typeof req.body?.email !== "string") return next();
    const windowMs = 15 * 60 * 1000;
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const id = crypto.createHash("sha256").update(`${req.path}:${req.body.email.trim().toLowerCase()}:${windowStart}`).digest("hex");
    try {
      const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } };
      let attempts;
      try { attempts = await Model.findOneAndUpdate({ _id: id }, update, { upsert: true, new: true }); }
      catch (error) { if (error.code !== 11000) throw error; attempts = await Model.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { new: true }); }
      if (attempts.count > 30) {
        res.setHeader("Retry-After", String(Math.ceil((windowStart + windowMs - Date.now()) / 1000)));
        return res.status(429).json({ message: "Too many login or signup attempts for this email. Please try again later." });
      }
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { authLimit: createAuthLimit(), createAuthLimit };
