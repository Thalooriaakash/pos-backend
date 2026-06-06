const express = require("express");
const router = express.Router();

const billController = require("../controllers/billController");
const auth = require("../middleware/authMiddleware");

// ✅ SPECIAL ROUTES FIRST
router.get("/items/by-date/:date", billController.getItemSalesByDate);
router.get("/by-date/:date", billController.getBillsByDate);
router.get("/", billController.getAllBills);

// ✅ DYNAMIC ROUTES LAST
router.get("/:id", auth(["admin","cashier","waiter"]), billController.getBillById);
router.put("/:id/payment", auth(["admin","cashier"]), billController.updatePayment);
module.exports = router;