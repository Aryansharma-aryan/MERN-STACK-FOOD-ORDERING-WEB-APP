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

const allowedOrigins = [
  "http://localhost:5173",
  "https://mern-stack-food-ordering-web-9xes0pm6f.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

mongodb();

app.get("/", (req, res) => {
  res.send("✅ API is running.");
});

app.use("/api", authRoutes);

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
    console.log(`📍 Location Update from ${deliveryPersonId}: ${lat}, ${lng}`);
    io.emit("locationUpdate", { deliveryPersonId, lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// Catch 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }

  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Server error occurred" });
});

const PORT = process.env.PORT || 3101;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
