const productModel = require("../models/productModel");

// ✅ ADD PRODUCT
exports.addProduct = async (req, res) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        await productModel.createProduct(req.body);
        res.json({ message: "Product added successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ GET PRODUCTS
exports.getProducts = async (req, res) => {
    try {
        const products = await productModel.getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ UPDATE
exports.updateProduct = async (req, res) => {
    try {
        await productModel.updateProduct(req.params.id, req.body);
        res.json({ message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
};

// ✅ DELETE
exports.deleteProduct = async (req, res) => {
    try {
        await productModel.deleteProduct(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
};