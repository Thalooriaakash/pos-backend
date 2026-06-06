const db = require("../config/db");

// ==============================
// ✅ CREATE ORDER
// ==============================
exports.createOrder = async (req, res) => {

    //const { items } = req.body;
const { items, parcel_total = 0 } = req.body;

    // ✅ VALIDATION
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let total = 0;

        for (let item of items) {

            const [products] = await connection.query(
                "SELECT * FROM products WHERE id = ?",
                [item.product_id]
            );

            if (products.length === 0) {
                throw new Error("Product not found");
            }

            const product = products[0];

            // ✅ CHECK AVAILABILITY
            if (!product.is_available) {
                throw new Error(`${product.name} is not available`);
            }

            total += product.price * item.quantity;

            // ===============================
            // 🔥 RECIPE PRODUCT
            // ===============================
            if (product.type === "recipe") {

                const [recipeItems] = await connection.query(
                    "SELECT * FROM recipes WHERE product_id = ?",
                    [product.id]
                );

                if (recipeItems.length === 0) {
                    throw new Error(`No recipe found for ${product.name}`);
                }

                for (let r of recipeItems) {

                    const [ingredient] = await connection.query(
                        "SELECT * FROM ingredients WHERE id = ?",
                        [r.ingredient_id]
                    );

                    if (ingredient.length === 0) continue;

                    let currentStock = parseFloat(ingredient[0].stock || 0);
                    let minStock = parseFloat(ingredient[0].minQty || 0);

                    // ❌ LOW STOCK BLOCK
                    if (currentStock <= minStock) {
                        throw new Error(`${ingredient[0].name} is low stock`);
                    }

                    const requiredQty = r.quantity * item.quantity;

                    // ❌ NOT ENOUGH STOCK
                    if (currentStock < requiredQty) {
                        throw new Error(`Not enough ${ingredient[0].name}`);
                    }

                    const newStock = currentStock - requiredQty;

                    await connection.query(
                        "UPDATE ingredients SET stock = ? WHERE id = ?",
                        [newStock, r.ingredient_id]
                    );
                }

            } 
            // ===============================
            // 🔥 DIRECT PRODUCT
            // ===============================
            else {

                const currentStock = Number(product.stock || 0);

                if (currentStock < item.quantity) {
                    throw new Error(`${product.name} out of stock`);
                }

                // ✅ SAFE UPDATE
                const [updateResult] = await connection.query(
                    "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                    [item.quantity, product.id, item.quantity]
                );

                if (updateResult.affectedRows === 0) {
                    throw new Error(`${product.name} stock conflict, try again`);
                }
            }
        }

        // ===============================
        // ✅ CREATE ORDER
        // ===============================
total += Number(parcel_total || 0);
        
const [orderResult] = await connection.query(
  `INSERT INTO orders
   (total_amount, parcel_total, status)
   VALUES (?, ?, 'active')`,
  [total, parcel_total]
);
        const orderId = orderResult.insertId;

        // ===============================
        // ✅ SAVE ORDER ITEMS
        // ===============================
        for (let item of items) {
            await connection.query(
                "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
                [orderId, item.product_id, item.quantity]
            );
        }

        await connection.commit();

        // ===============================
        // 🔥 SOCKET (REALTIME)
        // ===============================
        const io = req.app.get("io");
        if (io) {
            io.emit("newOrder", { orderId });
        }

        res.json({ message: "Order placed successfully", orderId });

    } catch (error) {

        await connection.rollback();
        console.error("ORDER ERROR:", error.message);

        res.status(400).json({ message: error.message });

    } finally {
        connection.release();
    }
};


// ==============================
// ✅ GET BILL
// ==============================
exports.getOrderBill = async (req, res) => {

    const { id } = req.params;

    try {

        const [items] = await db.query(
            `SELECT p.name, p.price, p.image, oi.quantity
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

       const [order] = await db.query(
  "SELECT parcel_total FROM orders WHERE id = ?",
  [id]
);

const parcelTotal = Number(order[0]?.parcel_total || 0);

let foodTotal = 0;
items.forEach(item => {
  foodTotal += item.price * item.quantity;
});

const total = foodTotal + parcelTotal;

res.json({
  orderId: id,
  items,
  foodTotal,
  parcelTotal,
  total
});
    } catch (error) {
        res.status(500).json(error);
    }
};


// ==============================
// ✅ GET ORDER DETAILS
// ==============================
exports.getOrderById = async (req, res) => {

    const orderId = req.params.id;

    try {

        const [order] = await db.query(
            "SELECT * FROM orders WHERE id = ?",
            [orderId]
        );

        const [items] = await db.query(
            `SELECT oi.quantity, p.name, p.price 
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        res.json({
            order: order[0],
            items
        });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ==============================
// ✅ SALES SUMMARY
// ==============================
exports.getSalesSummary = async (req, res) => {
    try {

        const [totalData] = await db.query(
            "SELECT COUNT(*) AS totalOrders, IFNULL(SUM(total_amount),0) AS totalRevenue FROM orders WHERE status='active'"
        );

        const [todayData] = await db.query(
            "SELECT COUNT(*) AS todayOrders, IFNULL(SUM(total_amount),0) AS todayRevenue FROM orders WHERE DATE(created_at)=CURDATE() AND status='active'"
        );

        res.json({
            totalOrders: totalData[0].totalOrders,
            totalRevenue: totalData[0].totalRevenue,
            todayOrders: todayData[0].todayOrders,
            todayRevenue: todayData[0].todayRevenue
        });

    } catch (err) {
        res.status(500).json({ message: "Error fetching sales data" });
    }
};


// ==============================
// ✅ UPDATE PAYMENT
// ==============================
exports.updatePayment = async (req, res) => {

    const { id } = req.params;
    const { method } = req.body;

    try {

        await db.query(
            "UPDATE orders SET payment_method=?, payment_status='paid' WHERE id=?",
            [method, id]
        );

        res.json({ message: "Payment updated" });

    } catch (err) {
        res.status(500).json(err);
    }
};


// ==============================
// ✅ RECENT ORDERS
// ==============================
exports.getRecentOrders = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT id, total_amount
            FROM orders
            WHERE status='active'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json(err);
    }
};


// ==============================
// ✅ SALES GRAPH
// ==============================
exports.getSalesGraph = async (req, res) => {

    const { date } = req.params;

    try {

        const [rows] = await db.query(`
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE DATE(created_at) = ?
            AND status='active'
            GROUP BY hour
        `, [date]);

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Graph error" });
    }
};


// ==============================
// ✅ TOP SELLING
// ==============================
exports.getTopSelling = async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) AS total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status='active'
            GROUP BY oi.product_id
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching top items" });
    }
};