// api/index.js – Vercel serverless entry with detailed logging
console.log('🔄 Loading serverless function...');

try {
  console.log('📦 Requiring backend/app...');
  const app = require('../backend/app');
  console.log('✅ App loaded successfully.');
  module.exports = app;
} catch (error) {
  console.error('❌ Serverless function failed to load:', error);
  console.error('Stack trace:', error.stack);
  module.exports = (req, res) => {
    console.error(`🔴 Request to ${req.url} failed – function load error`);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}
