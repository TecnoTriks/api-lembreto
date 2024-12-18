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

/**
 * @swagger
 * /api/verificacao/salvar-contato:
 *   post:
 *     tags: [Verificação]
 *     summary: Salva o contato do Lembreto no WhatsApp do usuário
 *     description: Envia um cartão de contato do Lembreto para o número do usuário identificado pela API Key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - api_key
 *             properties:
 *               api_key:
 *                 type: string
 *                 description: API Key do usuário que receberá o contato
 *                 example: "a1b2c3d4..."
 *     responses:
 *       200:
 *         description: Contato enviado com sucesso
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
 *                   example: "Contato enviado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     numero:
 *                       type: string
 *                       description: Número que recebeu o contato
 *                       example: "5563984193411"
 *       400:
 *         description: Requisição inválida
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/salvar-contato', async (req, res, next) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Dados inválidos',
        { message: 'API Key é obrigatória' }
      );
    }

    const resultado = await WhatsAppService.salvarContato(api_key);

    res.json(
      successResponse(
        HttpStatus.OK,
        'Contato enviado com sucesso',
        resultado
      )
    );
  } catch (error) {
    if (error.message === 'Usuário não encontrado') {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Usuário não encontrado',
        { message: 'API Key inválida' }
      );
    }
    next(error);
  }
});

module.exports = router;
