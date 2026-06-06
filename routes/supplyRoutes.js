const express = require("express");
const router = express.Router();

const {
  getSupplies,
  addSupply,
  updateSupply,
  deleteSupply,
} = require("../controllers/supplyController");

router.get("/", getSupplies);
router.post("/", addSupply);
router.put("/:id", updateSupply);
router.delete("/:id", deleteSupply);

module.exports = router;