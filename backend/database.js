const mysql = require('mysql2/promise'); // Use promise-based connections
let pool;

const initDatabase = () => {
  if (!pool) {
    console.log('Initializing database connection pool...');
    pool = mysql.createPool({
      host: process.env.RDS_HOST, 
      user: process.env.RDS_USER, 
      password: process.env.RDS_PASSWORD, 
      database: process.env.RDS_DATABASE,
      waitForConnections: true,
      connectionLimit: 10, // Adjust based on your needs
      queueLimit: 0,
    });
  }

  // Attach error handling only after pool is created
  pool.on('error', (err) => {
    console.error('MySQL Pool Error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reinitializing database connection...');
      pool = null; // Reset pool
      initDatabase(); // Reinitialize
    }
  });
  
  return pool;
};

// **Execute Query Helper** (Prevents Statement Leaks)
async function executeQuery(query, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    throw new Error(`Query failed: ${err.message}`);
  } finally {
    connection.release(); // Always release connection back to the pool
  }
}

module.exports = { initDatabase, executeQuery };




