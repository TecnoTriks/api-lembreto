const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { HttpStatus, ApiMessages, successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Lembrete:
 *       type: object
 *       required:
 *         - titulo
 *         - tipo
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título do lembrete
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do lembrete
 *         tipo:
 *           type: string
 *           enum: [Contas a Pagar, Saúde, Normal]
 *           description: Tipo do lembrete
 *         data_hora:
 *           type: string
 *           format: date-time
 *           description: Data e hora do lembrete (opcional)
 *         recorrente:
 *           type: boolean
 *           description: Indica se o lembrete é recorrente
 *         frequencia:
 *           type: string
 *           enum: [Diária, Semanal, Mensal, Anual]
 *           description: Frequência do lembrete recorrente
 *         dia:
 *           type: integer
 *           minimum: 1
 *           maximum: 31
 *           description: Dia do mês para lembretes recorrentes mensais
 *         hora:
 *           type: string
 *           format: time
 *           description: Hora específica para o lembrete
 *         data:
 *           type: string
 *           format: date
 *           description: Data específica para o lembrete
 *         dia_semana:
 *           type: string
 *           enum: [Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado]
 *           description: Dia da semana para lembretes recorrentes semanais
 *         mes:
 *           type: string
 *           enum: [Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro]
 *           description: Mês para lembretes recorrentes anuais
 */

/**
 * @swagger
 * /api/lembretes:
 *   post:
 *     tags: [Lembretes]
 *     summary: Cria um novo lembrete
 *     description: |
 *       Cria um novo lembrete com os dados fornecidos.
 *       Para lembretes recorrentes, os campos obrigatórios variam conforme a frequência:
 *       - Mensal: requer dia e hora
 *       - Semanal: requer dia_semana e hora
 *       - Anual: requer dia, mês e hora
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lembrete'
 *     responses:
 *       201:
 *         description: Lembrete criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { 
      titulo, 
      descricao, 
      tipo, 
      data_hora, 
      recorrente, 
      frequencia,
      dia,
      hora,
      data,
      dia_semana,
      mes
    } = req.body;

    // Log dos dados recebidos
    console.log('Dados recebidos:', {
      titulo, tipo, recorrente, frequencia,
      dia, hora, data, dia_semana, mes,
      userId: req.user?.userId
    });

    // Validação do usuário
    if (!req.user || !req.user.userId) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        'Erro de autenticação',
        { message: 'Usuário não identificado no token' }
      );
    }

    // Validação dos campos obrigatórios
    if (!titulo || !tipo) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: 'Título e tipo são obrigatórios' }
      );
    }

    // Validação do tipo
    const tiposValidos = ['Contas a Pagar', 'Saúde', 'Normal'];
    if (!tiposValidos.includes(tipo)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: `Tipo inválido. Valores aceitos: ${tiposValidos.join(', ')}` }
      );
    }

    // Validação de recorrência
    if (recorrente && frequencia) {
      const frequenciasValidas = ['Diária', 'Semanal', 'Mensal', 'Anual'];
      if (!frequenciasValidas.includes(frequencia)) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ApiMessages.VALIDATION_ERROR,
          { message: `Frequência inválida. Valores aceitos: ${frequenciasValidas.join(', ')}` }
        );
      }

      switch (frequencia) {
        case 'Mensal':
          if (!dia || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes mensais, dia e hora são obrigatórios' }
            );
          }
          if (dia < 1 || dia > 31) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Dia deve estar entre 1 e 31' }
            );
          }
          break;
        case 'Semanal':
          const diasValidos = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          if (!dia_semana || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes semanais, dia da semana e hora são obrigatórios' }
            );
          }
          if (!diasValidos.includes(dia_semana)) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: `Dia da semana inválido. Valores aceitos: ${diasValidos.join(', ')}` }
            );
          }
          break;
        case 'Anual':
          const mesesValidos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
          if (!dia || !mes || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes anuais, dia, mês e hora são obrigatórios' }
            );
          }
          if (!mesesValidos.includes(mes)) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: `Mês inválido. Valores aceitos: ${mesesValidos.join(', ')}` }
            );
          }
          break;
      }
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO lembretes (
          titulo, descricao, tipo, data_hora, recorrente, frequencia, 
          dia, hora, data, dia_semana, mes, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          titulo, descricao, tipo, data_hora, recorrente, frequencia,
          dia, hora, data, dia_semana, mes, req.user.userId
        ]
      );
      
      res.status(HttpStatus.CREATED).json(
        successResponse(
          HttpStatus.CREATED,
          ApiMessages.CREATED,
          { 
            id: result.insertId,
            message: 'Lembrete criado com sucesso',
            dados: {
              titulo,
              tipo,
              recorrente,
              frequencia
            }
          }
        )
      );
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Erro ao salvar no banco de dados',
        { 
          message: dbError.message,
          code: dbError.code,
          sqlMessage: dbError.sqlMessage 
        }
      );
    }
  } catch (error) {
    console.error('Erro na criação do lembrete:', error);
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
 *             $ref: '#/components/schemas/Lembrete'
 *     responses:
 *       200:
 *         description: Lembrete atualizado com sucesso
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      descricao, 
      tipo, 
      data_hora, 
      recorrente, 
      frequencia,
      dia,
      hora,
      data,
      dia_semana,
      mes
    } = req.body;

    // Verificar se o lembrete existe e pertence ao usuário
    const [lembretes] = await pool.execute(
      'SELECT id FROM lembretes WHERE id = ? AND usuario_id = ?',
      [id, req.user.userId]
    );

    if (lembretes.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Lembrete não encontrado'
      );
    }

    // Validação adicional para campos recorrentes
    if (recorrente && frequencia) {
      switch (frequencia) {
        case 'Mensal':
          if (!dia || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes mensais, dia e hora são obrigatórios' }
            );
          }
          break;
        case 'Semanal':
          if (!dia_semana || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes semanais, dia da semana e hora são obrigatórios' }
            );
          }
          break;
        case 'Anual':
          if (!dia || !mes || !hora) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ApiMessages.VALIDATION_ERROR,
              { message: 'Para lembretes anuais, dia, mês e hora são obrigatórios' }
            );
          }
          break;
      }
    }

    await pool.execute(
      `UPDATE lembretes SET 
        titulo = ?, 
        descricao = ?, 
        tipo = ?, 
        data_hora = ?, 
        recorrente = ?, 
        frequencia = ?,
        dia = ?,
        hora = ?,
        data = ?,
        dia_semana = ?,
        mes = ?
      WHERE id = ? AND usuario_id = ?`,
      [
        titulo, descricao, tipo, data_hora, recorrente, frequencia,
        dia, hora, data, dia_semana, mes,
        id, req.user.userId
      ]
    );

    res.json(
      successResponse(
        HttpStatus.OK,
        ApiMessages.UPDATED
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
