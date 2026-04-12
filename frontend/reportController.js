const db = require("../config/db");

// ✅ DAILY REPORT
exports.getDailyReport = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                oi.id,
                p.name,
                oi.quantity,
                p.price,
                (oi.quantity * p.price) AS total,
                DATE(o.created_at) as date,
                TIME(o.created_at) as time
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.created_at) = CURDATE()
            ORDER BY oi.id ASC
        `);

        // ✅ SERIAL NUMBER RESET DAILY
        let result = rows.map((r, index) => ({
            sno: index + 1,
            ...r
        }));

        res.json(result);

    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ DATE FILTER
exports.getReportByDate = async (req, res) => {
    const { date } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT 
                oi.id,
                p.name,
                oi.quantity,
                p.price,
                (oi.quantity * p.price) AS total,
                DATE(o.created_at) as date,
                TIME(o.created_at) as time
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.created_at) = ?
        `, [date]);

        let result = rows.map((r, i) => ({
            sno: i + 1,
            ...r
        }));

        res.json(result);

    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ PRODUCT REPORT (FROM - TO)
exports.getProductReport = async (req, res) => {
    const { from, to, product } = req.query;

    try {
        const [rows] = await db.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) as total_qty,
                SUM(oi.quantity * p.price) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.created_at) BETWEEN ? AND ?
            AND p.name LIKE ?
            GROUP BY p.name
        `, [from, to, `%${product}%`]);

        res.json(rows);

    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ MONTHLY REPORT
exports.getMonthlyReport = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) as total_qty,
                SUM(oi.quantity * p.price) as total_sales
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE MONTH(o.created_at) = MONTH(CURDATE())
            GROUP BY p.name
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json(err);
    }
};