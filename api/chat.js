const express = require('express');
const chatRoute = require('../backend/src/routes/chatRoute');

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoute);

module.exports = app;
