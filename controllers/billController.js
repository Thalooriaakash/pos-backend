const db = require("../config/db");

// ==============================
// ✅ GET BILL BY ID
// ==============================
exports.getBillById = async (req, res) => {
  const { id } = req.params;

  try {
    // 🔹 GET ORDER
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE id = ?AND status='active'",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const order = orders[0];

    // 🔹 GET ITEMS
    const [items] = await db.query(
      `SELECT oi.quantity, p.name, p.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ? `,
      [id]
    );

    res.json({
      order,
      items
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load bill" });
  }
};


// ==============================
// ✅ UPDATE PAYMENT
// ==============================
exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const { method, status } = req.body;

  try {
    await db.query(
      "UPDATE orders SET payment_method=?, payment_status=? WHERE id=?",
      [method, status, id]
    );

    res.json({ message: "Payment updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment update failed" });
  }
};




// ==============================
// ✅ GET BILLS BY DATE
// ==============================
exports.getBillsByDate = async (req, res) => {
  const { date } = req.params;

  try {
    const [orders] = await db.query(`
      SELECT * FROM orders
      WHERE DATE(created_at) = ? AND status='active'
    `, [date]);

    for (let order of orders) {
      const [items] = await db.query(`
        SELECT p.name, oi.quantity, p.price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      order.items = items;
    }

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};
// ==============================
// ✅ GET ALL BILLS
// ==============================
exports.getAllBills = async (req, res) => {

  try {
    const [rows] = await db.query(
      `SELECT id, total_amount, payment_method, payment_status, created_at
       FROM orders WHERE status='active'
       ORDER BY created_at DESC`
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};

// ==============================
// ✅ ITEM SALES BY DATE
// ==============================
exports.getItemSalesByDate = async (req, res) => {
  const { date } = req.params;

  
  try {
    const [rows] = await db.query(
      `SELECT 
          p.name,
          SUM(oi.quantity) AS total_qty,
          SUM(oi.quantity * p.price) AS total_amount
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE DATE(o.created_at) = ?
       GROUP BY p.name
       ORDER BY total_qty DESC`,
      [date]
    );

    res.json(rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to fetch item sales" });
  }
};