const awsServerlessExpress = require('aws-serverless-express');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');
const db = initDatabase();
const tasksRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');
const linkedinRoutes = require('./routes/linkedin')
const commonRoutes = require('./routes/common')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/linkedin',linkedinRoutes);
app.use('/api/common',commonRoutes);

// Keep-Alive Query (every 5 minutes)
setInterval(async () => {
  try {
    const [rows] = await db.query('SELECT 1'); // Simple query to keep the connection alive
  } catch (err) {
    console.error('Keep-alive query failed:', err);
  }
}, 5 * 60 * 1000); // Run every 5 minutes


// Start LOCAL server only in development mode
if (process.env.NODE_ENV !== 'production') {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}else{
  // Create the server
  const server = awsServerlessExpress.createServer(app);
  exports.handler = (event, context) => {
    return awsServerlessExpress.proxy(server, event, context);
  };
  
}

