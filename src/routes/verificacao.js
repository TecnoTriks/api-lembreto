const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/whatsappService');
const { HttpStatus, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/verificacao/whatsapp:
 *   post:
 *     tags: [Verificação]
 *     summary: Verifica se os números fornecidos são WhatsApp válidos
 *     description: Verifica uma lista de números para determinar se são contas válidas do WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numeros
 *             properties:
 *               numeros:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de números para verificar (apenas números, sem formatação)
 *                 example: ["63984193411"]
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Verificação realizada com sucesso"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       numero:
 *                         type: string
 *                         example: "553198296801"
 *                       verificado:
 *                         type: boolean
 *                         example: true
 *                       jid:
 *                         type: string
 *                         example: "553198296801@s.whatsapp.net"
 *                         nullable: true
 *       400:
 *         description: Requisição inválida
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/whatsapp', async (req, res, next) => {
  try {
    const { numeros } = req.body;

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Lista de números inválida',
        { message: 'Forneça uma lista válida de números para verificação' }
      );
    }

    // Remove caracteres não numéricos de todos os números
    const numerosLimpos = numeros.map(numero => numero.replace(/\D/g, ''));

    const resultados = await WhatsAppService.verificarNumeros(numerosLimpos);

    res.json(
      successResponse(
        HttpStatus.OK,
        'Verificação realizada com sucesso',
        resultados
      )
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
