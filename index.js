require('dotenv').config();
const express = require('express');
const emailRoutes = require('./routes/email.routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/email', emailRoutes);

app.get('/health', (req, res) => {
  res.send('Expense Tracker Email Processor is running.');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
