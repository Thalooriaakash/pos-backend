const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ IMAGE UPLOAD
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


// ✅ GET PRODUCTS
router.get("/", auth(["admin","cashier","waiter"]), async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products");

    products.forEach(p => {
      if (p.image) {
        p.image = `http://localhost:5000/${p.image.replace("\\", "/")}`;
      }
p.is_available = p.is_available ?? 1;
      // fix null values
      p.stock = p.stock ?? 0;
      p.min_stock = p.min_stock ?? 0;

    });

    // ✅ ROLE-BASED CONTROL
    if (req.user.role === "waiter" || req.user.role === "cashier") {
      products.forEach(p => {
        delete p.stock;
        delete p.min_stock;
      });
    }

    res.json(products);

  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json(err);
  }
});


// ✅ ADD PRODUCT (FIXED)
router.post("/", auth(["admin"]), upload.single("image"), async (req, res) => {

  try {
    console.log("BODY:", req.body);

    const name = req.body.name;
    const type = req.body.type;
    const price = req.body.price;

    const stock = Number(req.body.stock || 0);
    const min_stock = Number(req.body.min_stock || 0);

    let recipe = req.body.recipe;

    const image = req.file ? req.file.path.replace("\\", "/") : null;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name required" });
    }

    const finalStock = type === "direct" ? stock : 0;
    const finalMinStock = type === "direct" ? min_stock : 0;

    // ✅ INSERT PRODUCT
    const [result] = await db.query(
      "INSERT INTO products (name, type, price, stock, min_stock, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, type, price, finalStock, finalMinStock, image]
    );

    const productId = result.insertId;

    // ===============================
    // 🔥 FIXED RECIPE LOGIC
    // ===============================
    if (type === "recipe") {

      if (!recipe) {
        return res.status(400).json({ message: "Recipe required" });
      }

      let ingArr;

      try {
        ingArr = JSON.parse(recipe);
      } catch (e) {
        console.error("Parse error:", recipe);
        return res.status(400).json({ message: "Invalid recipe format" });
      }

      // ❌ DON'T ALLOW EMPTY
      if (!Array.isArray(ingArr) || ingArr.length === 0) {
        return res.status(400).json({ message: "Add at least one ingredient" });
      }

      const values = ingArr.map(i => [
        productId,
        Number(i.id),
        Number(i.qty)
      ]);

      await db.query(
        "INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES ?",
        [values]
      );
    }

    res.json({ message: "Product added successfully" });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }

});

// ✅ DELETE
router.delete("/:id",auth(["admin"]), async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json(err);
  }
});


// ✅ UPDATE (FULL FIX WITH STOCK)
router.put("/:id",auth(["admin"]), async (req, res) => {
  try {
    const { name, price, stock, min_stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name & Price required" });
    }

    const finalStock = Number(stock || 0);
    const finalMinStock = Number(min_stock || 0);

    await db.query(
      "UPDATE products SET name=?, price=?, stock=?, min_stock=? WHERE id=?",
      [name, price, finalStock, finalMinStock, req.params.id]
    );

    res.json({ message: "Updated Successfully" });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json(err);
  }
});
// ✅ GET INGREDIENTS FOR A PRODUCT
router.get("/:id/ingredients", auth(["admin","cashier","waiter"]), async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT i.name, r.quantity, i.unit
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.product_id = ?
    `, [req.params.id]);

    res.json(rows);

  } catch (err) {
    console.error("GET INGREDIENTS ERROR:", err);
    res.status(500).json(err);
  }
});

// ✅ TOGGLE AVAILABILITY
router.put("/:id/toggle", auth(["admin"]), async (req, res) => {
  try {
    await db.query(
      "UPDATE products SET is_available = NOT is_available WHERE id=?",
      [req.params.id]
    );

    res.json({ message: "Availability updated" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;