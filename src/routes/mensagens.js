const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { HttpStatus, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const whatsappService = require('../services/whatsappService');

/**
 * @swagger
 * /api/mensagens/whatsapp:
 *   post:
 *     tags: [Mensagens]
 *     summary: Envia uma mensagem via WhatsApp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telefone
 *               - mensagem
 *             properties:
 *               telefone:
 *                 type: string
 *                 description: Número de telefone com DDD
 *               mensagem:
 *                 type: string
 *               delay:
 *                 type: integer
 *                 description: Delay em milissegundos (opcional, padrão 1200)
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 */
router.post('/whatsapp', auth, async (req, res, next) => {
  try {
    const { telefone, mensagem, delay = 1200 } = req.body;

    if (!telefone || !mensagem) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Telefone e mensagem são obrigatórios'
      );
    }

    // Formata o número de telefone
    let numeroFormatado = telefone.replace(/\D/g, '');
    if (!numeroFormatado.startsWith('55')) {
      numeroFormatado = `55${numeroFormatado}`;
    }

    const response = await whatsappService.enviarMensagem(numeroFormatado, mensagem, delay);

    res.json(
      successResponse(
        HttpStatus.OK,
        'Mensagem enviada com sucesso',
        response
      )
    );
  } catch (error) {
    if (error.response) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Erro ao enviar mensagem',
        { error: error.response.data }
      );
    }
    next(error);
  }
});

module.exports = router;
