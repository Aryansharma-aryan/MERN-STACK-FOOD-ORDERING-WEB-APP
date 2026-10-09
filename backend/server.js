require("dotenv").config(); // Load env FIRST

const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const mongodb = require("./db/db");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

// ================================
// 1️⃣ CORS Configuration
// ================================
const cors = require("cors");
const corsOptions = require("./config/cors");
app.use(cors(corsOptions));

// ================================
// 2️⃣ Basic Health Check
// ================================
app.get("/healthz", (_req, res) => res.sendStatus(204));

// ================================
// 3️⃣ Middlewares
// ================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// ================================
// 4️⃣ Database Init
// ================================
mongodb();

// ================================
// 5️⃣ Routes
// ================================
app.get("/", (req, res) => res.send("✅ API is running."));
app.use("/api", authRoutes);

// ================================
// Order tracking uses authenticated order and admin location endpoints.
// ================================

// ================================
// 7️⃣ 404 Handler
// ================================
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ================================
// 8️⃣ Global Error Handler
// ================================
app.use((err, req, res, next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Server error occurred" });
});

// ================================
// 9️⃣ Start Server
// ================================
const PORT = process.env.PORT || 3102;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Running on port ${PORT}`));
