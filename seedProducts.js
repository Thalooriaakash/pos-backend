const db = require("./config/db");

const images = [
  "pizza.jpg",
  "burger.jpg",
  "pasta.jpg",
  "fries.jpg",
  "coffee.jpg"
];

const seedProducts = async () => {
  try {
    const values = [];

    for (let i = 1; i <= 100; i++) {
      values.push([
        `Test Item ${i}`,
        Math.floor(Math.random() * 500) + 20, // price
        "Food",
        Math.floor(Math.random() * 100) + 10, // stock
        10, // min stock always fixed
        images[i % images.length] // rotating images
      ]);
    }

    await db.query(
      `INSERT INTO products (name, price, category, stock, min_stock, image) VALUES ?`,
      [values]
    );

    console.log("✅ 100 products inserted with images & stock");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedProducts();