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

// ✅ Setup allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL,
  process.env.FRONTEND_URL_ALT,
  process.env.FRONTEND_URL_VERCEL,
].filter(Boolean);

console.log("✅ Allowed Origins:", allowedOrigins);

// ✅ CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log("🌐 Request Origin:", origin);

    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin: " + origin));
    }
  },
  credentials: true,
}));

// ✅ Express Middlewares
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ MongoDB Connection
mongodb();

// ✅ API Routes
app.use("/api", authRoutes); // e.g., /api/login

// ✅ Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("updateLocation", ({ deliveryPersonId, lat, lng }) => {
    console.log(`📍 ${deliveryPersonId}: ${lat}, ${lng}`);
    io.emit("locationUpdate", { deliveryPersonId, lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Server error occurred" });
});

// ✅ Start the Server
const PORT = process.env.PORT || 3101;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
