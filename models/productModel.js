const db = require("../config/db");

exports.getAllProducts = async () => {
    const [rows] = await db.query("SELECT * FROM products");
    return rows;
};

exports.createProduct = async (data) => {
    const { name, category, price, stock,type } = data;

    const [result] = await db.query(
        "INSERT INTO products (name, category, price, stock, type) VALUES (?, ?, ?, ?, ?)",
        [name, category, price, stock,type]
    );

    return result;
};
exports.updateProduct = async (id, data) => {
    const { name, price } = data;

    const [result] = await db.query(
        "UPDATE products SET name=?, price=? WHERE id=?",
        [name, price, id]
    );

    return result;
};
exports.deleteProduct = async (id) => {
    const [result] = await db.query(
        "DELETE FROM products WHERE id=?",
        [id]
    );

    return result;
};