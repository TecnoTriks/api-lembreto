const app = require('../src/app');

// Vercel serverless handler
const handler = (req, res) => {
  if (!req.url.startsWith('/api/')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};

module.exports = handler;
