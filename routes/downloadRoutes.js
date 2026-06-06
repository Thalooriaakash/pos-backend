const express = require("express");
const router = express.Router();


const downloadController = require("../controllers/downloadController");

router.get("/products", downloadController.downloadProducts);
router.get("/ingredients", downloadController.downloadIngredients);
router.get("/supplies", downloadController.downloadSupplies);

router.get("/bills", downloadController.downloadBills);
router.get("/ordersummary", downloadController.downloadOrderSummary);

module.exports = router;