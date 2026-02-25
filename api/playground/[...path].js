const express = require('express');
const playgroundRoute = require('../../backend/src/routes/playgroundRoute');

const app = express();
app.use(express.json());
app.use('/api/playground', playgroundRoute);

module.exports = app;
