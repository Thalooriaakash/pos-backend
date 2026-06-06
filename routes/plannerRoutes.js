
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");

// =====================================
// CALCULATE INGREDIENT REQUIREMENTS
// =====================================
router.post(
  "/calculate",
  auth(["admin"]),
  async (req, res) => {

    try {

      const { items } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({
          message: "No products selected"
        });
      }

      // ==============================
      // STORE TOTAL REQUIRED INGREDIENTS
      // ==============================
      const ingredientMap = {};

      // =========================================
      // LOOP PRODUCTS USER WANTS TO MAKE
      // =========================================
      for (let item of items) {

        const productId = item.product_id;
        const qtyToMake = Number(item.quantity);

        // ==============================
        // GET PRODUCT
        // ==============================
        const [products] = await db.query(
          "SELECT * FROM products WHERE id=?",
          [productId]
        );

        if (products.length === 0) continue;

        const product = products[0];

        // ==============================
        // GET RECIPE
        // ==============================
        const [recipeItems] = await db.query(
          `SELECT
            r.*,
            i.name,
            i.stock,
            i.unit,
            i.minQty
          FROM recipes r
          JOIN ingredients i
          ON r.ingredient_id = i.id
          WHERE r.product_id=?`,
          [productId]
        );

        // ==============================
        // CALCULATE REQUIRED QTY
        // ==============================
        for (let r of recipeItems) {

          const requiredQty =
            Number(r.quantity) * qtyToMake;

          // ==============================
          // FIRST TIME
          // ==============================
          if (!ingredientMap[r.ingredient_id]) {

            ingredientMap[r.ingredient_id] = {
              ingredient_id: r.ingredient_id,
              name: r.name,
              unit: r.unit,
              available: Number(r.stock || 0),
              minQty: Number(r.minQty || 0),
              required: 0
            };
          }

          // ==============================
          // ADD TOTAL REQUIRED
          // ==============================
          ingredientMap[r.ingredient_id].required += requiredQty;
        }
      }

      // =========================================
      // FINAL RESULT
      // =========================================
      const result = Object.values(ingredientMap).map(i => {

        const remaining = i.available - i.required;

        return {
          ...i,
          remaining,

          status:
            remaining < 0
              ? "SHORTAGE"
              : remaining <= i.minQty
              ? "LOW"
              : "ENOUGH"
        };
      });

      res.json(result);

    } catch (err) {

      console.error("PLANNER ERROR:", err);

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

module.exports = router;
