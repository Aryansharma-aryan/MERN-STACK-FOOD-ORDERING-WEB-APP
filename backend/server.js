require("dotenv").config(); // Load env FIRST

const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const mongodb = require("./db/db");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

// ================================
// 1️⃣ CORS Configuration
// ================================
const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  "https://mern-stack-food-ordering-web-app.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log("🧭 Incoming Origin:", origin);

  if (
    origin &&
    allowedOrigins.some(o => (o instanceof RegExp ? o.test(origin) : o === origin))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "7200");
  }

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

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
// 6️⃣ Socket.IO Setup
// ================================
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some(o => (o instanceof RegExp ? o.test(origin) : o === origin))) {
        cb(null, true);
      } else cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

io.on("connection", socket => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("updateLocation", data => io.emit("locationUpdate", data));

  socket.on("disconnect", () => console.log("❌ Socket Disconnected:", socket.id));
});

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
