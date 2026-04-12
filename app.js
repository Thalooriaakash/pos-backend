require("dotenv").config();
const express = require("express");
const app = express();
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ✅ ROUTES
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const ingredientRoutes = require("./routes/ingredientRoutes");
const reportRoutes = require("./routes/reportRoutes");

console.log("MAIN FILE RUNNING");

// =============================
// 🔐 RATE LIMITING
// =============================

// Global limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 100,
    max: 100,
    message: "Too many requests, try again later"
});
app.use(limiter);

// Login limiter
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 10000,
    max: 5,
    message: "Too many login attempts"
});
app.use("/auth/login", loginLimiter);


// =============================
// ✅ MIDDLEWARE
// =============================
app.use(cors({
    origin: "*", // you can restrict later
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve frontend
app.use(express.static("frontend"));

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// =============================
// ✅ ROUTES
// =============================
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/ingredients", ingredientRoutes);
app.use("/reports", reportRoutes);


// =============================
// ✅ HEALTH CHECK
// =============================
app.get("/", (req, res) => {
    res.send("Server Running ✅");
});


// =============================
// ❌ 404 HANDLER
// =============================
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});


// =============================
// ❌ GLOBAL ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);
    res.status(500).json({ message: "Server error" });
});


// =============================
// ✅ SOCKET.IO
// =============================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

const userRoutes = require("./routes/userRoutes");
app.use("/users", userRoutes);
// make socket available everywhere
app.set("io", io);


// =============================
// ✅ START SERVER
// =============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});