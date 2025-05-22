require('dotenv').config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const mongodb = require("./db/db");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

// ✅ Define allowed origins
const allowedOrigins = [
    process.env.FRONTEND_URL_LOCAL,
    process.env.FRONTEND_URL_ALT,
    process.env.FRONTEND_URL_VERCEL
].filter(Boolean);

console.log("✅ Allowed CORS Origins:", allowedOrigins);

// ✅ CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            const msg = `❌ CORS blocked request from: ${origin}`;
            console.error(msg);
            callback(new Error(msg));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204
}));

// ✅ Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// ✅ Middleware
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ DB Connection
mongodb();

// ✅ Routes
app.use("/api", authRoutes);
// You can add more here...

// ✅ Socket.IO Real-time handling
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
