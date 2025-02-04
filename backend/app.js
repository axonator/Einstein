const awsServerlessExpress = require('aws-serverless-express');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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
// Create the server
const server = awsServerlessExpress.createServer(app);
// Lambda handler
exports.handler = (event, context) => {
  // Ensure API Gateway doesn't use cached responses
  context.callbackWaitsForEmptyEventLoop = false;

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ message: "CORS preflight success" }),
    };
  }

  // Proceed with normal API request handling
  return awsServerlessExpress.proxy(server, event, context);
};




// Start LOCAL server
// const PORT = 5000;
// app.listen(PORT, () => {
//  console.log(`Server running on port ${PORT}`);
// });
