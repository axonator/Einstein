const awsServerlessExpress = require('aws-serverless-express');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const tasksRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');
const linkedinRoutes = require('./routes/linkedin')
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/linkedin',linkedinRoutes);

// Create the server
const server = awsServerlessExpress.createServer(app);
// Lambda handler
exports.handler = (event, context) => {
  return awsServerlessExpress.proxy(server, event, context);
};

// Start LOCAL server only in development mode
if (process.env.NODE_ENV !== 'production') {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

