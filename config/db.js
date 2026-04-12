const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "1234",   // ✅ use your real password
    database: "restaurant_pos",
});

module.exports = pool.promise();