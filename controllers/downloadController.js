const db = require("../config/db");
const XLSX = require("xlsx");

// PRODUCTS
exports.downloadProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
      id,
      name,
      category,
      price,
      stock,
      min_stock,
      type,
      is_available
      FROM products
    `);

    sendExcel(rows, "products.xlsx", res);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

// INGREDIENTS
exports.downloadIngredients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
      id,
      name,
      stock,
      unit,
      minQty
      FROM ingredients
    `);

    sendExcel(rows, "ingredients.xlsx", res);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

// SUPPLIES
exports.downloadSupplies = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
      id,
      item_name,
      supplier_name,
      price,
      min_value,
      current_value
      FROM supplies
    `);

    sendExcel(rows, "supplies.xlsx", res);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

// BILLS
exports.downloadBills = async (req, res) => {
  const { from, to } = req.query;

  try {
    const [rows] = await db.query(`
      SELECT
      id,
      total_amount,
      payment_method,
      payment_status,
      status,
      parcel_total,
      created_at
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
    `, [from, to]);

    sendExcel(rows, "bills.xlsx", res);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

// ORDER SUMMARY
exports.downloadOrderSummary = async (req, res) => {
  const { from, to } = req.query;

  try {
    const [rows] = await db.query(`
      SELECT
      p.name,
      SUM(oi.quantity) AS qty_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY qty_sold DESC
    `, [from, to]);

    sendExcel(rows, "ordered_items.xlsx", res);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

// COMMON EXCEL FUNCTION
function sendExcel(data, fileName, res) {
  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Report"
  );

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${fileName}`
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(buffer);
}