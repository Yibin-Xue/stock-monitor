const express = require('express');
const app = express();
const port = 3003;

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});
