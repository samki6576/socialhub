// api/index.js – Vercel serverless entry
try {
  const app = require('../backend/app');
  module.exports = app;
} catch (error) {
  console.error('❌ Serverless function failed to load:', error);
  module.exports = (req, res) => {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  };
}
