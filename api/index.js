const app = require('../src/app');

// Handler para funções serverless do Vercel
module.exports = (req, res) => {
  // Adiciona o path original à requisição
  req.url = req.url.replace(/^\/api/, '');
  
  return app(req, res);
};
