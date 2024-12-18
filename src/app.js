const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const swaggerSpec = require('./config/swagger');
const { errorHandler, errorResponse } = require('./middleware/errorHandler');
const { HttpStatus, successResponse } = require('./utils/apiResponse');

const usuariosRoutes = require('./routes/usuarios');
const lembretesRoutes = require('./routes/lembretes');
const tagsRoutes = require('./routes/tags');
const notificacoesRoutes = require('./routes/notificacoes');
const mensagensRoutes = require('./routes/mensagens');
const verificacaoRoutes = require('./routes/verificacao');

const app = express();

// Configuração CORS
app.use(cors());
app.use(express.json());

// Configuração do Helmet com CSP ajustado
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Headers de segurança adicionais
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configuração específica para o Swagger UI
app.use('/api-docs', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline'");
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.json(
    successResponse(HttpStatus.OK, 'Bem-vindo à API Lembreto', {
      docs: '/api-docs',
      health: '/health'
    })
  );
});

// Rotas da API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/lembretes', lembretesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/verificacao', verificacaoRoutes);

// Documentação Swagger
app.get('/api-docs', (req, res) => {
  res.send(`
    <!-- HTML for static distribution bundle build -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>API Lembreto - Documentação</title>
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .topbar { display: none; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"> </script>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"> </script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(swaggerSpec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            persistAuthorization: true
          });
          window.ui = ui;
        }
      </script>
    </body>
    </html>
  `);
});

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  res.json(
    successResponse(HttpStatus.OK, 'API está funcionando corretamente', {
      uptime: process.uptime(),
      timestamp: new Date(),
      env: process.env.NODE_ENV
    })
  );
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).json(
    errorResponse(HttpStatus.NOT_FOUND, 'Rota não encontrada')
  );
});

// Se não estiver em produção, inicia o servidor
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api-lembreto.vercel.app'
    : `http://localhost:${PORT}`;
    
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Documentação Swagger disponível em: ${baseUrl}/api-docs`);
  });
}

module.exports = app;
