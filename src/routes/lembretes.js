const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { HttpStatus, ApiMessages, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/lembretes:
 *   post:
 *     tags: [Lembretes]
 *     summary: Cria um novo lembrete
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - data_hora
 *               - tipo
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [Contas a Pagar, Saúde, Normal]
 *               data_hora:
 *                 type: string
 *                 format: date-time
 *               recorrente:
 *                 type: boolean
 *               frequencia:
 *                 type: string
 *                 enum: [Diária, Semanal, Mensal, Anual]
 *     responses:
 *       201:
 *         description: Lembrete criado com sucesso
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { titulo, descricao, tipo, data_hora, recorrente, frequencia } = req.body;

    if (!titulo || !tipo || !data_hora) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: 'Título, tipo e data/hora são obrigatórios' }
      );
    }
    
    const [result] = await pool.execute(
      'INSERT INTO lembretes (titulo, descricao, tipo, data_hora, recorrente, frequencia, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo, descricao, tipo, data_hora, recorrente, frequencia, req.user.userId]
    );
    
    res.status(HttpStatus.CREATED).json(
      successResponse(
        HttpStatus.CREATED,
        ApiMessages.CREATED,
        { id: result.insertId }
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/lembretes:
 *   get:
 *     tags: [Lembretes]
 *     summary: Lista todos os lembretes do usuário
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de lembrete
 *     responses:
 *       200:
 *         description: Lista de lembretes retornada com sucesso
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const { tipo } = req.query;
    let query = 'SELECT * FROM lembretes WHERE usuario_id = ?';
    const params = [req.user.userId];
    
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }
    
    const [lembretes] = await pool.execute(query, params);
    res.json(
      successResponse(
        HttpStatus.OK,
        'Lembretes recuperados com sucesso',
        lembretes
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/lembretes/{id}:
 *   put:
 *     tags: [Lembretes]
 *     summary: Atualiza um lembrete
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
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               tipo:
 *                 type: string
 *               data_hora:
 *                 type: string
 *               recorrente:
 *                 type: boolean
 *               frequencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lembrete atualizado com sucesso
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, data_hora, recorrente, frequencia } = req.body;
    
    // Constrói a query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];
    
    if (titulo !== undefined) {
      updateFields.push('titulo = ?');
      updateValues.push(titulo);
    }
    if (descricao !== undefined) {
      updateFields.push('descricao = ?');
      updateValues.push(descricao);
    }
    if (tipo !== undefined) {
      updateFields.push('tipo = ?');
      updateValues.push(tipo);
    }
    if (data_hora !== undefined) {
      updateFields.push('data_hora = ?');
      updateValues.push(data_hora);
    }
    if (recorrente !== undefined) {
      updateFields.push('recorrente = ?');
      updateValues.push(recorrente);
    }
    if (frequencia !== undefined) {
      updateFields.push('frequencia = ?');
      updateValues.push(frequencia);
    }
    
    if (updateFields.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Nenhum campo para atualizar'
      );
    }
    
    const query = `UPDATE lembretes SET ${updateFields.join(', ')} WHERE id = ? AND usuario_id = ?`;
    const values = [...updateValues, id, req.user.userId];
    
    const [result] = await pool.execute(query, values);
    
    if (result.affectedRows === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Lembrete não encontrado'
      );
    }
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Lembrete atualizado com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/lembretes/{id}:
 *   delete:
 *     tags: [Lembretes]
 *     summary: Remove um lembrete
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
 *         description: Lembrete removido com sucesso
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM lembretes WHERE id = ? AND usuario_id = ?',
      [id, req.user.userId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Lembrete não encontrado'
      );
    }
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Lembrete removido com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
