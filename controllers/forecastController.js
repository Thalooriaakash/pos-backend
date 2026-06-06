const db = require("../config/db");

exports.getForecastByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const [rows] = await db.query(
      `
      SELECT
          p.id AS product_id,
          p.name,
          p.category,
          ROUND(AVG(sales_data.daily_qty), 0) AS predicted_qty
      FROM (
          SELECT
              DATE(o.created_at) AS sale_date,
              oi.product_id,
              SUM(oi.quantity) AS daily_qty
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'active'
            AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            AND DAYNAME(o.created_at) = DAYNAME(?)
          GROUP BY DATE(o.created_at), oi.product_id
      ) AS sales_data
      JOIN products p
        ON p.id = sales_data.product_id
      GROUP BY p.id, p.name, p.category
      ORDER BY predicted_qty DESC
      `,
      [date]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Forecast Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};