require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const mongodb = require("./db/db");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

// ✅ Read allowed origins from .env
const allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL,
  process.env.FRONTEND_URL_ALT,
  process.env.FRONTEND_URL_VERCEL
].filter(Boolean);

// ✅ CORS Middleware for Express
app.use(cors({
  origin: function (origin, callback) {
    console.log("Request Origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));

// ✅ Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// ✅ Middleware
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Connect to MongoDB
mongodb();

// ✅ Routes
app.use("/api", authRoutes);

// ✅ Socket.io Events
io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  socket.on("updateLocation", ({ deliveryPersonId, lat, lng }) => {
    console.log(`📍 ${deliveryPersonId}: ${lat}, ${lng}`);
    io.emit("locationUpdate", { deliveryPersonId, lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("Server error:", err);
  res.status(500).json({ error: "Server error occurred" });
});

// ✅ Start Server
const PORT = process.env.PORT || 3100;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  
});
