require("dotenv").config();

const express = require("express");
const app = express();

const http = require("http");
const { Server } = require("socket.io");

const rateLimit = require("express-rate-limit");
const path = require("path");
const cors = require("cors");

// =============================
// 🔥 ROUTES
// =============================
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const ingredientRoutes = require("./routes/ingredientRoutes");
const reportRoutes = require("./routes/reportRoutes");
const billRoutes = require("./routes/billRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const supplyRoutes = require("./routes/supplyRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const downloadRoutes = require("./routes/downloadRoutes");


console.log("MAIN FILE RUNNING");

// =============================
// 🔐 RATE LIMITING
// =============================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests, try again later"
});

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1000,
    message: "Too many login attempts"
});

// =============================

// =============================

// =============================
// ✅ MIDDLEWARE (FIXED)
// =============================
// ⚠️ IMPORTANT: increase limit BEFORE routes
app.use(express.json({ limit: "20mb" }));
app.use(cors({ origin: "*" }));

// ONLY FOR URL ENCODED DATA
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
//app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// serve frontend
app.use(express.static("frontend"));

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// 🧠 ROUTES
// =============================
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/bill", billRoutes);
app.use("/products", productRoutes);
app.use("/ingredients", ingredientRoutes);
app.use("/reports", reportRoutes);
app.use("/users", userRoutes);
app.use("/recipes", recipeRoutes);
app.use("/planner", plannerRoutes);
app.use("/supplies", supplyRoutes);
app.use("/forecast", forecastRoutes);
app.use("/downloads", downloadRoutes);
// =============================
// ❤️ HEALTH CHECK
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

    res.status(err.status || 500).json({
        message: err.message || "Server error"
    });
});

// =============================
// ⚡ SOCKET.IO SETUP
// =============================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
   
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// make io available everywhere
app.set("io", io);

// =============================
// 🚀 START SERVER
// =============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});