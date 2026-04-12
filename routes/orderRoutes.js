const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");
const db = require("../config/db");


// ✅ ADMIN ONLY - REPORTS
router.get("/reports", auth(["admin"]), orderController.getSalesSummary);

// ✅ ADMIN + CASHIER - SALES DATA
router.get("/sales", auth(["admin","cashier"]), orderController.getSalesSummary);


// ✅ GET LAST 4 ORDERS (ALL ROLES)
router.get("/recent", auth(["admin","cashier","waiter"]), async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT 
                o.id,
                o.total_amount,
                GROUP_CONCAT(p.name SEPARATOR ', ') AS items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.id DESC
            LIMIT 4
        `);

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// ✅ GET ORDER (ALL ROLES)
router.get("/:id", auth(["admin","cashier","waiter"]), orderController.getOrderById);


// ✅ PAYMENT (ONLY ADMIN + CASHIER)
router.put("/:id/payment", auth(["admin","cashier"]), orderController.updatePayment);


// ✅ CREATE ORDER (ALL ROLES)
router.post("/", auth(["admin","cashier","waiter"]), orderController.createOrder);

router.get("/sales-graph/:date", auth(["admin"]), orderController.getSalesGraph);

router.get("/top-selling", auth(["admin","cashier"]), orderController.getTopSelling);
module.exports = router;