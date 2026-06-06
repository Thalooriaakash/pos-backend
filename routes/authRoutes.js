const express = require("express");
const router = express.Router();


const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const db = require("../config/db"); 


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
// ✅ VERIFY_OTP
router.post(
  "/verify-otp",
  authController.verifyOTP
);
//✅
router.post(
  "/reset-password",
  authController.resetPassword
);

// =====================================
// CHANGE PASSWORD
// =====================================
router.put(
  "/change-password",
  auth(["admin"]),

  async (req, res) => {

    try {

      const { currentPassword, newPassword } =
        req.body;

      const userId = req.user.id;

      // FIND USER
      const [results] = await db.query(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );

      if (results.length === 0) {

        return res.status(404).json({
          message: "User not found"
        });
      }

      const user = results[0];

      // CHECK CURRENT PASSWORD
      const isMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!isMatch) {

        return res.status(400).json({
          message:
            "Current password incorrect"
        });
      }

      // HASH NEW PASSWORD
      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      // UPDATE PASSWORD
      await db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, userId]
      );

      return res.json({
        success: true,
        message:
          "Password updated successfully"
      });

    } catch (err) {

      return res.status(500).json({
        message: "Server error"
      });
    }
  }
);
module.exports = router;