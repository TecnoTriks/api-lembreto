const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { HttpStatus, ApiMessages, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/tags:
 *   post:
 *     tags: [Tags]
 *     summary: Cria uma nova tag
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *               cor:
 *                 type: string
 *               icone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag criada com sucesso
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { nome, cor = '#FFFFFF', icone } = req.body;

    if (!nome) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Nome da tag é obrigatório'
      );
    }
    
    const [result] = await pool.execute(
      'INSERT INTO tags (nome, cor, icone, usuario_id) VALUES (?, ?, ?, ?)',
      [nome, cor, icone, req.user.userId]
    );
    
    res.status(HttpStatus.CREATED).json(
      successResponse(
        HttpStatus.CREATED,
        'Tag criada com sucesso',
        { id: result.insertId }
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tags:
 *   get:
 *     tags: [Tags]
 *     summary: Lista todas as tags do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tags retornada com sucesso
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const [tags] = await pool.execute(
      'SELECT * FROM tags WHERE usuario_id = ?',
      [req.user.userId]
    );
    res.json(
      successResponse(
        HttpStatus.OK,
        'Tags recuperadas com sucesso',
        tags
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     tags: [Tags]
 *     summary: Atualiza uma tag
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
 *               nome:
 *                 type: string
 *               cor:
 *                 type: string
 *               icone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag atualizada com sucesso
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cor, icone } = req.body;
    
    // Constrói a query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];
    
    if (nome !== undefined) {
      updateFields.push('nome = ?');
      updateValues.push(nome);
    }
    if (cor !== undefined) {
      updateFields.push('cor = ?');
      updateValues.push(cor);
    }
    if (icone !== undefined) {
      updateFields.push('icone = ?');
      updateValues.push(icone);
    }
    
    if (updateFields.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Nenhum campo para atualizar'
      );
    }
    
    const query = `UPDATE tags SET ${updateFields.join(', ')} WHERE id = ? AND usuario_id = ?`;
    const values = [...updateValues, id, req.user.userId];
    
    const [result] = await pool.execute(query, values);
    
    if (result.affectedRows === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Tag não encontrada'
      );
    }
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Tag atualizada com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     tags: [Tags]
 *     summary: Remove uma tag
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
 *         description: Tag removida com sucesso
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM tags WHERE id = ? AND usuario_id = ?',
      [id, req.user.userId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Tag não encontrada'
      );
    }
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Tag removida com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tags/lembrete/{lembreteId}:
 *   post:
 *     tags: [Tags]
 *     summary: Associa tags a um lembrete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lembreteId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagIds
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Tags associadas com sucesso
 */
router.post('/lembrete/:lembreteId', auth, async (req, res, next) => {
  try {
    const { lembreteId } = req.params;
    const { tagIds } = req.body;

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Lista de IDs de tags é obrigatória'
      );
    }

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

    // Verifica se todas as tags pertencem ao usuário
    const [tags] = await pool.execute(
      'SELECT id FROM tags WHERE id IN (?) AND usuario_id = ?',
      [tagIds, req.user.userId]
    );

    if (tags.length !== tagIds.length) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Uma ou mais tags não encontradas'
      );
    }

    // Remove associações antigas
    await pool.execute(
      'DELETE FROM lembrete_tags WHERE lembrete_id = ?',
      [lembreteId]
    );

    // Insere novas associações
    for (const tagId of tagIds) {
      await pool.execute(
        'INSERT INTO lembrete_tags (lembrete_id, tag_id) VALUES (?, ?)',
        [lembreteId, tagId]
      );
    }

    res.json(
      successResponse(
        HttpStatus.OK,
        'Tags associadas com sucesso'
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tags/lembrete/{lembreteId}:
 *   get:
 *     tags: [Tags]
 *     summary: Lista todas as tags de um lembrete
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
 *         description: Lista de tags do lembrete retornada com sucesso
 *       404:
 *         description: Lembrete não encontrado
 */
router.get('/lembrete/:lembreteId', auth, async (req, res, next) => {
  try {
    const { lembreteId } = req.params;
    
    const [tags] = await pool.execute(
      `SELECT t.* FROM tags t 
       INNER JOIN lembretes_tags lt ON t.id = lt.tag_id 
       INNER JOIN lembretes l ON lt.lembrete_id = l.id 
       WHERE l.id = ? AND l.usuario_id = ?`,
      [lembreteId, req.user.userId]
    );

    if (tags.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Nenhuma tag encontrada para este lembrete'
      );
    }
    
    res.json(
      successResponse(
        HttpStatus.OK,
        'Tags do lembrete recuperadas com sucesso',
        tags
      )
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
