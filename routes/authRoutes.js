const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

// ✅ LOGIN
router.post("/login", authController.login);

// ✅ REGISTER (ADMIN ONLY)
router.post("/register", auth(["admin"]), authController.register);

// ✅ ADMIN RESET PASSWORD (NEW)
router.post("/admin-reset", auth(["admin"]), authController.adminResetPassword);

// ✅ FORGOT PASSWORD (EMAIL OTP)
router.post("/forgot", authController.forgotPassword);

// ✅ RESET PASSWORD (OTP)
router.post("/reset", authController.resetPassword);

module.exports = router;