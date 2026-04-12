const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/authMiddleware");

// MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET
router.get("/", auth(["admin","cashier","waiter"]), async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM ingredients");

    results.forEach(i => {
      if (i.image) {
        i.image = `http://localhost:5000/${i.image.replace("\\", "/")}`;
      }
      i.unit = i.unit || "g";
    });

    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD
router.post("/", auth(["admin"]), upload.single("image"), async (req, res) => {
  try {
    const { name, stock, minQty, unit } = req.body;
    const image = req.file ? req.file.path.replace("\\", "/") : null;

    await db.query(
      "INSERT INTO ingredients (name, stock, minQty, unit, image) VALUES (?, ?, ?, ?, ?)",
      [name, stock, minQty, unit || "g", image]
    );

    res.json({ message: "Ingredient added successfully!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", auth(["admin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, stock, minQty, unit } = req.body;

    await db.query(
      "UPDATE ingredients SET name=?, stock=?, minQty=?, unit=? WHERE id=?",
      [name, stock, minQty, unit || "g", id]
    );

    res.json({ message: "Ingredient updated successfully!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", auth(["admin"]), async (req, res) => {
  try {
    const id = req.params.id;

    await db.query("DELETE FROM ingredients WHERE id=?", [id]);

    res.json({ message: "Ingredient deleted successfully!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOW INGREDIENT ALERT
router.get("/low", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM ingredients 
      WHERE CAST(stock AS DECIMAL(10,2)) <= CAST(minQty AS DECIMAL(10,2))
    `);

    res.json(rows);
  } catch (err) {
    console.error("LOW INGREDIENT ERROR:", err);
    res.status(500).json(err);
  }
});

module.exports = router;