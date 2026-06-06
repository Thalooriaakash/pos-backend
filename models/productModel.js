const db = require("../config/db");

// ✅ GET PRODUCTS PAGINATED (UPDATED FOR GLOBAL DB SEARCH)
exports.getProductsPaginated = async (limit, offset, search = "") => {
    // Wrapping search with % symbols allows MySQL to find matches anywhere in the string
    const searchTerm = `%${search}%`;
    
    const [rows] = await db.query(
        "SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
        [searchTerm, limit, offset]
    );
    return rows;
};

// ✅ GET PRODUCTS COUNT (UPDATED FOR GLOBAL DB SEARCH)
exports.getProductsCount = async (search = "") => {
    const searchTerm = `%${search}%`;
    
    const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM products WHERE name LIKE ?",
        [searchTerm]
    );
    return rows[0].count;
};

// ✅ CREATE PRODUCT
exports.createProduct = async (data) => {
    const { name, category, price, stock, type } = data;

    const [result] = await db.query(
        "INSERT INTO products (name, category, price, stock, type) VALUES (?, ?, ?, ?, ?)",
        [name, category, price, stock, type]
    );

    return result;
};

// ✅ UPDATE PRODUCT
exports.updateProduct = async (id, data) => {
    const { name, price } = data;

    const [result] = await db.query(
        "UPDATE products SET name=?, price=? WHERE id=?",
        [name, price, id]
    );

    return result;
};

// ✅ DELETE PRODUCT
exports.deleteProduct = async (id) => {
    const [result] = await db.query(
        "DELETE FROM products WHERE id=?",
        [id]
    );

    return result;
};