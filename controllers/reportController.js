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
// ✅ FIXED: DATE FILTER NOW AGGREGATES AND COUNTS CORRECTLY
exports.getReportByDate = async (req, res) => {
    const { date } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) as total_qty,
                AVG(p.price) as price,
                SUM(oi.quantity * p.price) as total_sales,
                DATE(o.created_at) as date
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE DATE(o.created_at) = ?
            GROUP BY p.name, DATE(o.created_at)
        `, [date]);

        // Map the rows to match the table variables cleanly
        let result = rows.map((r, i) => ({
            sno: i + 1,
            name: r.name,
            total_qty: r.total_qty,
            price: r.price,
            total_sales: r.total_sales,
            date: r.date,
            time: "—" // Time is stripped because items are grouped together for the whole day
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
};


// ✅ PRODUCT REPORT (WITH FALLBACK TIMELINE PROTECTION FOR AUTOCMPLETE)
exports.getProductReport = async (req, res) => {
    // If dates are missing (while typing in search box), default to wide boundary range
    const from = req.query.from || '1970-01-01';
    const to = req.query.to || '2099-12-31';
    const product = req.query.product || '';

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
}; // 📌 Verified: All closing blocks are properly wrapped!