 const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendMail");


// ✅ LOGIN (UPDATED WITH is_active + ROLE RETURN)
exports.login = async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ message: "Enter credentials" });
        }

        const [users] = await db.query(
            "SELECT * FROM users WHERE name = ?",
            [name]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = users[0];

        // ✅ CHECK ACTIVE USER
        if (user.is_active === 0) {
            return res.status(403).json({ message: "User disabled. Contact admin" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role
        });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ✅ REGISTER (ADMIN ONLY)
exports.register = async (req, res) => {
    try {
        const { name, password, role, email } = req.body;

        if (!name || !password || !role) {
            return res.status(400).json({ message: "All fields required" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (name, password, role, email) VALUES (?, ?, ?, ?)",
            [name, hashed, role, email || null]
        );

        res.json({ message: "User created successfully" });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ✅ ADMIN RESET PASSWORD (STEP 3)
exports.adminResetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ message: "User ID & New Password required" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password=? WHERE id=?",
            [hashed, userId]
        );

        res.json({ message: "Password reset by admin successfully" });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ✅ FORGOT PASSWORD (EMAIL OTP)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query(
            "SELECT * FROM users WHERE email=?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Email not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await db.query(
            "UPDATE users SET otp=?, otp_expiry=DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE email=?",
            [hashedOtp, email]
        );

        await sendOTP(email, otp);

        res.json({ message: "OTP sent to email" });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ✅ RESET PASSWORD (OTP)
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const [users] = await db.query(
            "SELECT * FROM users WHERE email=? AND otp_expiry > NOW()",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Wrong OTP" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password=?, otp=NULL WHERE email=?",
            [hashed, email]
        );

        res.json({ message: "Password reset successful" });

    } catch (err) {
        res.status(500).json(err);
    }
};