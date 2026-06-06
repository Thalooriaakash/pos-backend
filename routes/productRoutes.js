const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const productController = require("../controllers/productController"); // ✅ ADD THIS


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

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB (recommended for POS apps)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  }
});

// ✅ GET PRODUCTS
router.get("/", auth(["admin","cashier","waiter"]), productController.getProducts);
   


// ✅ ADD PRODUCT (FIXED)
       // ADD PRODUCT (FIXED)
// ======================
router.post("/", upload.single("image"), async (req, res) => {
  try {
        const name = req.body.name;
    const price = req.body.price;
    const type = req.body.type || "direct";
    const stock = req.body.stock || 0;
    const min_stock = req.body.min_stock || 0;

    if (!name) return res.status(400).json({ message: "Name required" });

    const image = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO products 
      (name, price, type, stock, min_stock, image) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, price, type, stock, min_stock, image]
    );
const productId = result.insertId;

// ✅ SAVE RECIPE INGREDIENTS
if (type === "recipe" && req.body.recipe) {

  const recipe = JSON.parse(req.body.recipe);

  for (const item of recipe) {

    await db.query(
      `INSERT INTO recipes 
      (product_id, ingredient_id, quantity, unit)
      VALUES (?, ?, ?, ?)`,
      [
        productId,
        item.id,
        item.qty,
        item.unit
      ]
    );

  }
}
// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");

    res.json({
      message: "Product added successfully",
      productId: result.insertId
    });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
// ✅ DELETE
// ✅ DELETE
router.delete("/:id", auth(["admin"]), async (req, res) => {

  try {

    const productId = req.params.id;

    // ✅ delete recipe rows first
    await db.query(
      "DELETE FROM recipes WHERE product_id=?",
      [productId]
    );

    // ✅ then delete product
    await db.query(
      "DELETE FROM products WHERE id=?",
      [productId]
    );

// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");

    res.json({ message: "Deleted" });

  } catch (err) {

    console.error("DELETE ERROR:", err);

    res.status(500).json({
      message: err.message
    });
  }
});
router.put("/recipes", auth(["admin"]), async (req, res) => {
  try {
    const { product_id, ingredient_id, quantity, unit } = req.body;

    if (!product_id || !ingredient_id) {
      return res.status(400).json({ message: "Missing IDs" });
    }

    await db.query(
      `UPDATE recipes 
       SET quantity = ?, unit = ?
       WHERE product_id = ? AND ingredient_id = ?`,
      [quantity, unit, product_id, ingredient_id]
    );
// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");


    res.json({ message: "Ingredient updated successfully" });

  } catch (err) {
    console.error("UPDATE RECIPE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ UPDATE (FULL FIX WITH STOCK)
    router.put("/:id", auth(["admin"]), upload.single("image"), async (req, res) => {
  try {

    const { name, price } = req.body;
    const stock = req.body.stock || 0;
    const min_stock = req.body.min_stock || 0;

    if (!name || !price) {
      return res.status(400).json({ message: "Name & Price required" });
    }

    await db.query(
      "UPDATE products SET name=?, price=?, stock=?, min_stock=? WHERE id=?",
      [name, price, stock, min_stock, req.params.id]
    );
// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");


    res.json({ message: "Updated Successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update error" });
  }
});
// ✅ GET INGREDIENTS FOR A PRODUCT
router.get("/:id/ingredients", auth(["admin"]), async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        i.id AS ingredient_id,
        i.name,
        r.quantity,
        COALESCE(r.unit, i.unit) AS unit
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
// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");

    res.json({ message: "Availability updated" });
  } catch (err) {
    res.status(500).json(err);
  }
});
// UPDATE RECIPE
router.put("/:id/recipe", async (req, res) => {

const productId = req.params.id;
const { recipe } = req.body;

try {

// delete old
await db.query("DELETE FROM recipes WHERE product_id=?", [productId]);

// insert new
const values = recipe.map(r => [
productId,
Number(r.id),
Number(r.qty)
]);

await db.query(
"INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES ?",
[values]
);
// 🔥 GET IO FROM APP
const io = req.app.get("io");

// 🔥 EMIT EVENT
io.emit("dataUpdated");


res.json({ message: "Recipe updated" });

} catch (err) {
res.status(500).json(err);
}
});



module.exports = router;