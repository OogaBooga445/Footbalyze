const mysql = require('mysql2/promise');

// MySQL connection pool — credentials come from environment (.env), with local-dev fallbacks
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fullstack_db',
  waitForConnections: true,
  connectionLimit: 10
});

// Verify connectivity on startup
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database');
    connection.release();
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
  });

module.exports = pool;
