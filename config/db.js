const mysql = require('mysql2');

// Pass the DATABASE_URL string directly—it already has your password and SSL settings built in!
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool.promise();