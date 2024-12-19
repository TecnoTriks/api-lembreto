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
 *           example: "Consulta médica"
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do lembrete
 *           example: "Consulta de rotina com Dr. João"
 *         tipo:
 *           type: string
 *           enum: [Contas a Pagar, Saúde, Normal]
 *           description: Tipo do lembrete
 *           example: "Saúde"
 *         data_hora:
 *           type: string
 *           format: date-time
 *           description: Data e hora específica do lembrete (opcional, usado apenas para lembretes não recorrentes)
 *           example: "2024-12-25T10:00:00"
 *         recorrente:
 *           type: boolean
 *           description: Indica se o lembrete é recorrente
 *           default: false
 *           example: true
 *         frequencia:
 *           type: string
 *           enum: [Diária, Semanal, Mensal, Anual]
 *           description: Frequência do lembrete recorrente (obrigatório se recorrente for true)
 *           example: "Mensal"
 *         dia:
 *           type: integer
 *           minimum: 1
 *           maximum: 31
 *           description: Dia do mês para lembretes mensais ou anuais
 *           example: 15
 *         hora:
 *           type: string
 *           format: time
 *           description: Hora específica para lembretes recorrentes (HH:mm)
 *           example: "14:30"
 *         data:
 *           type: string
 *           format: date
 *           description: Data específica para o lembrete (YYYY-MM-DD)
 *           example: "2024-12-25"
 *         dia_semana:
 *           type: string
 *           enum: [Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado]
 *           description: Dia da semana para lembretes semanais
 *           example: "Segunda"
 *         mes:
 *           type: string
 *           enum: [Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro]
 *           description: Mês para lembretes anuais
 *           example: "Dezembro"
 * 
 *     LembreteResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 201
 *         message:
 *           type: string
 *           example: "Lembrete criado com sucesso"
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             dados:
 *               type: object
 *               properties:
 *                 titulo:
 *                   type: string
 *                   example: "Consulta médica"
 *                 tipo:
 *                   type: string
 *                   example: "Saúde"
 *                 recorrente:
 *                   type: boolean
 *                   example: true
 *                 frequencia:
 *                   type: string
 *                   example: "Mensal"
 */

/**
 * @swagger
 * /api/lembretes:
 *   post:
 *     tags: [Lembretes]
 *     summary: Cria um novo lembrete
 *     description: |
 *       Cria um novo lembrete com os dados fornecidos. O lembrete pode ser único ou recorrente.
 *       
 *       Para lembretes não recorrentes:
 *       - Apenas título e tipo são obrigatórios
 *       - data_hora é opcional
 *       
 *       Para lembretes recorrentes, os campos obrigatórios variam conforme a frequência:
 *       - Diária: apenas hora
 *       - Semanal: dia_semana e hora
 *       - Mensal: dia e hora
 *       - Anual: dia, mês e hora
 *       
 *       Exemplos:
 *       1. Lembrete simples:
 *          ```json
 *          {
 *            "titulo": "Reunião",
 *            "tipo": "Normal"
 *          }
 *          ```
 *       
 *       2. Lembrete único com data:
 *          ```json
 *          {
 *            "titulo": "Dentista",
 *            "tipo": "Saúde",
 *            "data_hora": "2024-12-25T10:00:00"
 *          }
 *          ```
 *       
 *       3. Lembrete recorrente mensal:
 *          ```json
 *          {
 *            "titulo": "Pagar aluguel",
 *            "tipo": "Contas a Pagar",
 *            "recorrente": true,
 *            "frequencia": "Mensal",
 *            "dia": 5,
 *            "hora": "10:00"
 *          }
 *          ```
 *       
 *       4. Lembrete recorrente semanal:
 *          ```json
 *          {
 *            "titulo": "Reunião de equipe",
 *            "tipo": "Normal",
 *            "recorrente": true,
 *            "frequencia": "Semanal",
 *            "dia_semana": "Segunda",
 *            "hora": "14:30"
 *          }
 *          ```
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LembreteResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Erro de validação"
 *                 errors:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Título e tipo são obrigatórios"
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
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
      // Converte undefined para null em todos os valores
      const values = [
        titulo || null,
        descricao || null,
        tipo || null,
        data_hora || null,
        recorrente || false,
        frequencia || null,
        dia || null,
        hora || null,
        data || null,
        dia_semana || null,
        mes || null,
        req.user.userId
      ];

      const [result] = await pool.execute(
        `INSERT INTO lembretes (
          titulo, descricao, tipo, data_hora, recorrente, frequencia, 
          dia, hora, data, dia_semana, mes, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
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
              recorrente: recorrente || false,
              frequencia: frequencia || null
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
 *     description: |
 *       Retorna todos os lembretes do usuário autenticado.
 *       É possível filtrar por tipo e status.
 *       Os lembretes são retornados com todos os detalhes, incluindo informações de recorrência.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Contas a Pagar, Saúde, Normal]
 *         description: Filtrar por tipo de lembrete
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Concluído, Cancelado]
 *         description: Filtrar por status do lembrete
 *     responses:
 *       200:
 *         description: Lista de lembretes retornada com sucesso
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
 *                   example: "Lembretes listados com sucesso"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       titulo:
 *                         type: string
 *                         example: "Consulta médica"
 *                       descricao:
 *                         type: string
 *                         example: "Consulta de rotina com Dr. João"
 *                       tipo:
 *                         type: string
 *                         enum: [Contas a Pagar, Saúde, Normal]
 *                         example: "Saúde"
 *                       data_hora:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-12-25T10:00:00"
 *                         nullable: true
 *                       recorrente:
 *                         type: boolean
 *                         example: true
 *                       frequencia:
 *                         type: string
 *                         enum: [Diária, Semanal, Mensal, Anual]
 *                         example: "Mensal"
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         enum: [Ativo, Concluído, Cancelado]
 *                         example: "Ativo"
 *                       dia:
 *                         type: integer
 *                         example: 15
 *                         nullable: true
 *                       hora:
 *                         type: string
 *                         format: time
 *                         example: "14:30"
 *                         nullable: true
 *                       data:
 *                         type: string
 *                         format: date
 *                         example: "2024-12-25"
 *                         nullable: true
 *                       dia_semana:
 *                         type: string
 *                         enum: [Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado]
 *                         example: "Segunda"
 *                         nullable: true
 *                       mes:
 *                         type: string
 *                         enum: [Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro]
 *                         example: "Dezembro"
 *                         nullable: true
 *                       proxima_execucao:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-12-25T10:00:00"
 *                         nullable: true
 *                         description: Data e hora da próxima execução do lembrete
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const { tipo, status } = req.query;
    let query = 'SELECT * FROM lembretes WHERE usuario_id = ?';
    const params = [req.user.userId];
    
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY data_hora ASC, dia ASC, hora ASC';

    const [lembretes] = await pool.execute(query, params);

    // Processa os lembretes para adicionar a próxima execução
    const lembretesProcessados = lembretes.map(lembrete => {
      let proximaExecucao = null;

      if (lembrete.recorrente && lembrete.hora) {
        const hoje = new Date();
        const horaMinuto = lembrete.hora.split(':');
        
        switch (lembrete.frequencia) {
          case 'Diária':
            proximaExecucao = new Date(hoje.setHours(horaMinuto[0], horaMinuto[1], 0, 0));
            if (proximaExecucao < new Date()) {
              proximaExecucao.setDate(proximaExecucao.getDate() + 1);
            }
            break;
          
          case 'Semanal':
            const diasSemana = {
              'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3,
              'Quinta': 4, 'Sexta': 5, 'Sábado': 6
            };
            proximaExecucao = new Date(hoje.setHours(horaMinuto[0], horaMinuto[1], 0, 0));
            while (proximaExecucao.getDay() !== diasSemana[lembrete.dia_semana]) {
              proximaExecucao.setDate(proximaExecucao.getDate() + 1);
            }
            break;
          
          case 'Mensal':
            proximaExecucao = new Date(hoje.getFullYear(), hoje.getMonth(), lembrete.dia);
            proximaExecucao.setHours(horaMinuto[0], horaMinuto[1], 0, 0);
            if (proximaExecucao < new Date()) {
              proximaExecucao.setMonth(proximaExecucao.getMonth() + 1);
            }
            break;
          
          case 'Anual':
            const meses = {
              'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
              'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
              'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
            };
            proximaExecucao = new Date(hoje.getFullYear(), meses[lembrete.mes], lembrete.dia);
            proximaExecucao.setHours(horaMinuto[0], horaMinuto[1], 0, 0);
            if (proximaExecucao < new Date()) {
              proximaExecucao.setFullYear(proximaExecucao.getFullYear() + 1);
            }
            break;
        }
      } else if (lembrete.data_hora) {
        proximaExecucao = new Date(lembrete.data_hora);
      }

      return {
        ...lembrete,
        proxima_execucao: proximaExecucao ? proximaExecucao.toISOString() : null
      };
    });

    res.json(
      successResponse(
        HttpStatus.OK,
        'Lembretes listados com sucesso',
        lembretesProcessados
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
