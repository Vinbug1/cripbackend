const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const corsOptions = { origin: ['https://therealtradeai23.netlify.app/indexcca3'],credentials: true };
// const corsOptions = { origin: ['https://therealtradeai23.netlify.app/'],credentials: true };//
require('dotenv').config();
const authJwt = require('./helpers/jwt');

const app = express();
const api = process.env.API_URL;
const port = process.env.PORT || 6000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('tiny'));

// JWT Authentication
app.use(authJwt());

// Routes
app.use(`${api}/transactions`, require('./routes/transactions'));
app.use(`${api}/users`, require('./routes/users'));

// Error handling middleware should be applied last
const errorHandler = require('./helpers/error-handler.js');
app.use(errorHandler);

// Database Connection
const dbOptions = {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
  dbName: 'coin-db',
};

mongoose.connect(process.env.CONNECTION_STRING, dbOptions)
  .then(() => {
    console.log('Database Connection is ready...');
  })
  .catch((error) => {
    console.error('Database Connection Error:', error);
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
