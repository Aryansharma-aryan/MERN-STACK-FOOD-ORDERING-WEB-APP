const express = require("express");
const mongodb = require("./db/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http"); // 👈 Create HTTP server
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app); // 👈 Use HTTP server for Socket.io

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.1.5:5173"],
    credentials: true
  }
});

app.use(cors({
  origin: ["http://localhost:5173", "http://192.168.1.5:5173"],
  credentials: true
}));

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cookieParser());

// ✅ Connect to MongoDB
mongodb();

app.use("/api", authRoutes);

// ✅ Socket.io for Real-Time Order Tracking
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("updateLocation", ({ deliveryPersonId, lat, lng }) => {
    io.emit("locationUpdate", { deliveryPersonId, lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = 3100;
// ✅ Bind to 0.0.0.0 for external access
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
