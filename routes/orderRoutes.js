const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");
const db = require("../config/db");

// ==============================
// 🔥 ADMIN REPORTS
// ==============================
router.get("/reports", auth(["admin"]), orderController.getSalesSummary);

// ==============================
// 🔥 SALES (ADMIN + CASHIER)
// ==============================
router.get("/sales", auth(["admin","cashier"]), orderController.getSalesSummary);

// ==============================
// 🔥 RECENT ORDERS
// ==============================
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
            WHERE o.status = 'active'
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

// ==============================
// 🔥 TOP PRODUCTS BY DATE
// ==============================
router.get("/top-products/:date", auth(["admin","cashier"]), async (req,res)=>{
    try{
        const date = req.params.date;

        const [rows] = await db.query(`
            SELECT p.name, SUM(oi.quantity) AS total_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE DATE(o.created_at) = ? AND o.status='active'
            GROUP BY p.id
            ORDER BY total_qty DESC
            LIMIT 5
        `, [date]);

        res.json(rows);

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
});

// ==============================
// 🔥 ALL TIME TOP PRODUCTS
// ==============================
router.get("/top-products-all", auth(["admin","cashier"]), async (req,res)=>{
    try{
        const [rows] = await db.query(`
            SELECT p.name, SUM(oi.quantity) AS total_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status='active'
            GROUP BY p.id
            ORDER BY total_qty DESC
            LIMIT 5
        `);

        res.json(rows);

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
});

// ==============================
// 🔥 FILTER BY DATE
// ==============================
router.get("/by-date/:date", auth(["admin","cashier"]), async (req,res)=>{
    try{
        const date = req.params.date;

        const [rows] = await db.query(`
            SELECT * FROM orders
            WHERE DATE(created_at) = ?
            AND status='active'
            ORDER BY id DESC
        `,[date]);

        res.json(rows);

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

// ==============================
// 🔥 TODAY ORDERS (DEFAULT)
// ==============================
router.get("/", auth(["admin","cashier"]), async (req, res) => {
    try{
        const [rows] = await db.query(`
            SELECT * FROM orders
            WHERE status='active' 
            AND DATE(created_at)=CURDATE()
            ORDER BY id DESC
        `);

        res.json(rows);

    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ==============================
// 🔥 SALES GRAPH
// ==============================
router.get("/sales-graph/:date", auth(["admin"]), orderController.getSalesGraph);


// ==============================
// 🔥 TODAY ITEM SALES REPORT
// ==============================
router.get("/today-items", auth(["admin","cashier"]), async (req,res)=>{
try{

const [rows] = await db.query(`
SELECT 
    p.name,
    SUM(oi.quantity) AS total_qty,
    SUM(oi.quantity * p.price) AS total_amount
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE DATE(o.created_at) = CURDATE()
AND o.status='active'
GROUP BY p.id
ORDER BY total_qty DESC
`);

res.json(rows);

}catch(err){
console.error(err);
res.status(500).json({message:"Server error"});
}
});

// ==============================
// 🔴 SOFT DELETE
// ==============================
router.put("/:id/delete", auth(["admin","cashier","waiter"]), async (req, res) => {

    const conn = await db.getConnection();

    try {

        await conn.beginTransaction();

        // 1️⃣ Get ordered items + product type
        const [items] = await conn.query(`
            SELECT 
                oi.product_id,
                oi.quantity,
                p.type
            FROM order_items oi
            JOIN products p 
                ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [req.params.id]);

        // 2️⃣Restore stock
        for (const item of items) {

            // DIRECT PRODUCT
            if (item.type === "direct") {

                await conn.query(`
                    UPDATE products
                    SET stock = stock + ?
                    WHERE id = ?
                `, [item.quantity, item.product_id]);

            }

            //  RECIPE PRODUCT
            else if (item.type === "recipe") {

                // get recipe ingredients
                const [recipeItems] = await conn.query(`
                    SELECT 
                        ingredient_id,
                        quantity
                    FROM recipes
                    WHERE product_id = ?
                `, [item.product_id]);

                // restore ingredient stock
                for (const r of recipeItems) {

                    const restoreQty =
                        Number(r.quantity) * Number(item.quantity);

                    await conn.query(`
                        UPDATE ingredients
                        SET stock = stock + ?
                        WHERE id = ?
                    `, [restoreQty, r.ingredient_id]);
                }
            }
        }

        // 3️⃣ Soft delete order
        await conn.query(`
            UPDATE orders
            SET status='deleted'
            WHERE id=?
        `, [req.params.id]);

        await conn.commit();

        res.json({
            message: "Order deleted & stock restored"
        });

    } catch (err) {

        await conn.rollback();

        console.error(err);

        res.status(500).json({
            message: "Delete failed"
        });

    } finally {

        conn.release();
    }
});


// ==============================
// 🔴 HARD DELETE
// ==============================
router.delete("/:id", auth(["admin","cashier","waiter"]), async (req, res) => {
    try{
        await db.query("DELETE FROM orders WHERE id=?", [req.params.id]);
        res.json({ message: "Deleted permanently" });
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ==============================
// 🔥 GET SINGLE ORDER
// ==============================
router.get("/:id", auth(["admin","cashier","waiter"]), orderController.getOrderById);

// ==============================
// 🔥 PAYMENT UPDATE
// ==============================
router.put("/:id/payment", auth(["admin","cashier","waiter"]), orderController.updatePayment);

// ==============================
// 🔥 CREATE ORDER
// ==============================
router.post("/", auth(["cashier","waiter"]), orderController.createOrder);

module.exports = router;