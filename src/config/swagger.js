const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Lembreto',
      version: '1.0.0',
      description: 'API para gerenciamento de lembretes com notificações via WhatsApp',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api-lembreto.vercel.app'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      BearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos com anotações Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
