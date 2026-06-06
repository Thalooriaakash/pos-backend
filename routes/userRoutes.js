const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

// ✅ GET USERS
router.get("/", auth(["admin"]), async (req,res)=>{
const [users]=await db.query("SELECT id,name,email,role,is_active FROM users");
res.json(users);
});

// ✅ TOGGLE USER ACTIVE
router.put("/:id/toggle", auth(["admin"]), async (req,res)=>{
await db.query(
"UPDATE users SET is_active = NOT is_active WHERE id=?",
[req.params.id]
);
res.json({message:"Updated"});
});
// ==============================
// ✅ CREATE USER
// ==============================
router.post("/", auth(["admin"]), async (req, res) => {

  try {

    const { name, email, password, role } = req.body;

    // VALIDATION
    if (!name || !email || !password || !role) {

      return res.status(400).json({
        message: "All fields required"
      });

    }

    // ONLY CASHIER & WAITER
    const allowedRoles = ["cashier", "waiter"];

    if (!allowedRoles.includes(role)) {

      return res.status(400).json({
        message: "Invalid role"
      });

    }

    // CHECK EXISTING EMAIL
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    );

    if (existing.length > 0) {

      return res.status(400).json({
        message: "Email already exists"
      });

    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT USER
    await db.query(
      "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
      [name, email, hashedPassword, role]
    );

    res.json({
      message: "User created successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});

// ==============================
// ✅ DELETE USER
// ==============================
router.delete("/:id", auth(["admin"]), async (req, res) => {

  try {

    // CHECK USER
    const [rows] = await db.query(
      "SELECT role FROM users WHERE id=?",
      [req.params.id]
    );

    if (rows.length === 0) {

      return res.status(404).json({
        message: "User not found"
      });

    }

    // BLOCK ADMIN DELETE
    if (rows[0].role === "admin") {

      return res.status(403).json({
        message: "Cannot delete admin"
      });

    }

    // DELETE USER
    await db.query(
      "DELETE FROM users WHERE id=?",
      [req.params.id]
    );

    res.json({
      message: "User deleted"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Delete failed"
    });

  }

});
module.exports = router;