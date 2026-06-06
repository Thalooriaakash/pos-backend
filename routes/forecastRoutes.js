const express = require("express");
const router = express.Router();

const {
  getForecastByDate,
} = require("../controllers/forecastController");

router.get("/:date", getForecastByDate);

module.exports = router;