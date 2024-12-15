const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { HttpStatus, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/notificacoes:
 *   post:
 *     tags: [Notificações]
 *     summary: Cria uma nova notificação
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lembrete_id
 *               - tipo_envio
 *               - data_envio
 *             properties:
 *               lembrete_id:
 *                 type: integer
 *               tipo_envio:
 *                 type: string
 *                 enum: [WhatsApp, SMS]
 *               data_envio:
 *                 type: string
 *                 format: date-time
 *               mensagem:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { lembrete_id, tipo_envio, data_envio, mensagem } = req.body;

    if (!lembrete_id || !tipo_envio || !data_envio) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'ID do lembrete, tipo de envio e data de envio são obrigatórios'
      );
    }
    
    // Verifica se o lembrete pertence ao usuário
    const [lembretes] = await pool.execute(
      'SELECT id FROM lembretes WHERE id = ? AND usuario_id = ?',
      [lembrete_id, req.user.userId]
    );
    
    if (lembretes.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Lembrete não encontrado'
      );
    }
    
    const [result] = await pool.execute(
      'INSERT INTO notificacoes (lembrete_id, tipo_envio, data_envio, mensagem) VALUES (?, ?, ?, ?)',
      [lembrete_id, tipo_envio, data_envio, mensagem]
    );
    
    res.status(HttpStatus.CREATED).json(
      successResponse(
        HttpStatus.CREATED,
        'Notificação criada com sucesso',
        { id: result.insertId }
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notificacoes/lembrete/{lembreteId}:
 *   get:
 *     tags: [Notificações]
 *     summary: Lista todas as notificações de um lembrete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lembreteId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de notificações retornada com sucesso
 */
router.get('/lembrete/:lembreteId', auth, async (req, res, next) => {
  try {
    const { lembreteId } = req.params;
    
    // Verifica se o lembrete pertence ao usuário
    const [lembretes] = await pool.execute(
      'SELECT id FROM lembretes WHERE id = ? AND usuario_id = ?',
      [lembreteId, req.user.userId]
    );
    
    if (lembretes.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Lembrete não encontrado'
      );
    }
    
    const [notificacoes] = await pool.execute(
      `SELECT n.* 
       FROM notificacoes n
       INNER JOIN lembretes l ON n.lembrete_id = l.id
       WHERE l.id = ? AND l.usuario_id = ?`,
      [lembreteId, req.user.userId]
    );
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Notificações recuperadas com sucesso',
        notificacoes
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notificacoes/{id}:
 *   put:
 *     tags: [Notificações]
 *     summary: Atualiza uma notificação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_envio:
 *                 type: string
 *                 enum: [WhatsApp, SMS]
 *               data_envio:
 *                 type: string
 *                 format: date-time
 *               mensagem:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notificação atualizada com sucesso
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo_envio, data_envio, mensagem } = req.body;
    
    // Verifica se a notificação pertence a um lembrete do usuário
    const [notificacao] = await pool.execute(
      `SELECT n.* 
       FROM notificacoes n
       INNER JOIN lembretes l ON n.lembrete_id = l.id
       WHERE n.id = ? AND l.usuario_id = ?`,
      [id, req.user.userId]
    );
    
    if (notificacao.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Notificação não encontrada'
      );
    }
    
    // Constrói a query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];
    
    if (tipo_envio !== undefined) {
      updateFields.push('tipo_envio = ?');
      updateValues.push(tipo_envio);
    }
    if (data_envio !== undefined) {
      updateFields.push('data_envio = ?');
      updateValues.push(data_envio);
    }
    if (mensagem !== undefined) {
      updateFields.push('mensagem = ?');
      updateValues.push(mensagem);
    }
    
    if (updateFields.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Nenhum campo para atualizar'
      );
    }
    
    const query = `UPDATE notificacoes SET ${updateFields.join(', ')} WHERE id = ?`;
    const values = [...updateValues, id];
    
    await pool.execute(query, values);
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Notificação atualizada com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notificacoes/{id}:
 *   delete:
 *     tags: [Notificações]
 *     summary: Remove uma notificação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificação removida com sucesso
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verifica se a notificação pertence a um lembrete do usuário
    const [notificacao] = await pool.execute(
      `SELECT n.* 
       FROM notificacoes n
       INNER JOIN lembretes l ON n.lembrete_id = l.id
       WHERE n.id = ? AND l.usuario_id = ?`,
      [id, req.user.userId]
    );
    
    if (notificacao.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Notificação não encontrada'
      );
    }
    
    await pool.execute(
      'DELETE FROM notificacoes WHERE id = ?',
      [id]
    );
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Notificação removida com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
