const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// ✅ GET USERS
router.get("/", auth(["admin"]), async (req,res)=>{
const [users]=await db.query("SELECT id,name,role,is_active FROM users");
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

module.exports = router;