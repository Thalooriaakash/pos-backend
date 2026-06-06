const express = require("express");
const router = express.Router();
const db = require("../config/db");

const pool = require("../config/db"); // your db file

router.post("/", async (req, res) => {

  try {

    const {
      product_id,
      ingredient_id,
      quantity
    } = req.body;

    await pool.query(
      `
      INSERT INTO recipes
      (product_id, ingredient_id, quantity)
      VALUES (?, ?, ?)
      `,
      [product_id, ingredient_id, quantity]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Add failed"
    });
  }
});

router.put("/", async (req, res) => {

  try {

    const {
      product_id,
      ingredient_id,
      quantity
    } = req.body;

    await pool.query(
      `
      UPDATE recipes
      SET quantity = ?
      WHERE product_id = ? AND ingredient_id = ?
      `,
      [quantity, product_id, ingredient_id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Update failed"
    });
  }
});
router.delete("/", async (req, res) => {
  try {
    const { product_id, ingredient_id } = req.body;

    await db.query(
      "DELETE FROM recipes WHERE product_id=? AND ingredient_id=?",
      [product_id, ingredient_id]
    );

    res.json({ message: "Recipe item deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;