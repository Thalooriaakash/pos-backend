const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// All verified functions mapped perfectly
router.get("/daily", reportController.getDailyReport);
router.get("/date/:date", reportController.getReportByDate);
router.get("/product", reportController.getProductReport);
router.get("/monthly", reportController.getMonthlyReport);

module.exports = router;