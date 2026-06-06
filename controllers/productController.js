const productModel = require("../models/productModel");

// ✅ GET PRODUCTS 
exports.getProducts = async (req, res) => {
    try {
        // 1. Extract the search term along with page and limit
        let { page = 1, limit = 50, search = "" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        // 2. Pass the search term to both functions so pagination bounds adjust dynamically
        const products = await productModel.getProductsPaginated(limit, offset, search);
        const total = await productModel.getProductsCount(search);

        res.json({
            data: products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load products" });
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