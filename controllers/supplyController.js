const db = require("../config/db");

// GET ALL SUPPLIES
exports.getSupplies = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM supplies");
    res.json(rows);
  } catch (err) {
    console.log("GLOBAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.addSupply = async (req, res) => {
  try {
    const {
      item_name,
      supplier_name,
      price,
      min_value,
      current_value,
    } = req.body;

    const [existing] = await db.query(
      "SELECT id FROM supplies WHERE LOWER(item_name) = LOWER(?)",
      [item_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Supply already exists",
      });
    }

    await db.query(
      `INSERT INTO supplies
      (item_name, supplier_name, price, min_value, current_value)
      VALUES (?, ?, ?, ?, ?)`,
      [
        item_name,
        supplier_name,
        price,
        min_value,
        current_value,
      ]
    );

    res.json({
      success: true,
      message: "Supply added successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};


exports.updateSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, supplier_name, price, min_value, current_value } = req.body;

    await db.query(
      `UPDATE supplies SET item_name=?, supplier_name=?, price=?, min_value=?, current_value=? WHERE id=?`,
      [item_name, supplier_name, price, min_value, current_value, id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteSupply = async (req, res) => {
  try {
    await db.query("DELETE FROM supplies WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};