const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { HttpStatus, ApiMessages, successResponse, failResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Endpoints para gerenciamento de usuários
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nome
 *         - email
 *         - senha
 *         - telefone
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         senha:
 *           type: string
 *           format: password
 *           description: Senha do usuário
 *         telefone:
 *           type: string
 *           description: Telefone do usuário (apenas números)
 */

/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     tags: [Usuários]
 *     summary: Registra um novo usuário
 *     description: Registra um novo usuário no sistema. O telefone pode ser enviado com ou sem formatação (exemplo "63984193411" ou "(63) 98419-3411")
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *           example:
 *             nome: "João Silva"
 *             email: "joao@email.com"
 *             senha: "senha123"
 *             telefone: "(63) 98419-3411"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Criado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     api_key:
 *                       type: string
 *                       example: "a1b2c3d4..."
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email ou telefone já cadastrado
 */
router.post('/registro', async (req, res, next) => {
  try {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha || !telefone) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: 'Todos os campos são obrigatórios' }
      );
    }

    // Remove todos os caracteres não numéricos do telefone
    const telefoneNumerico = telefone.replace(/\D/g, '');

    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? OR telefone = ?',
      [email, telefoneNumerico]
    );

    if (existingUser.length > 0) {
      throw new AppError(
        HttpStatus.CONFLICT,
        'Email ou telefone já cadastrado'
      );
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, telefone, api_key) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hashedSenha, telefoneNumerico, apiKey]
    );
    
    res.status(HttpStatus.CREATED).json(
      successResponse(
        HttpStatus.CREATED,
        ApiMessages.CREATED,
        { 
          id: result.insertId,
          api_key: apiKey
        }
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     tags: [Usuários]
 *     summary: Realiza login do usuário
 *     description: Realiza login usando telefone e senha. O telefone pode ser enviado com ou sem formatação.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telefone
 *               - senha
 *             properties:
 *               telefone:
 *                 type: string
 *                 example: "(63) 98419-3411"
 *                 description: "Número de telefone com ou sem formatação"
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
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
 *                   example: "Login realizado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJ..."
 *                     api_key:
 *                       type: string
 *                       example: "a1b2c3d4..."
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req, res, next) => {
  try {
    const { telefone, senha } = req.body;

    if (!telefone || !senha) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: 'Telefone e senha são obrigatórios' }
      );
    }

    // Remove todos os caracteres não numéricos do telefone
    const telefoneNumerico = telefone.replace(/\D/g, '');

    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha, api_key, telefone FROM usuarios WHERE telefone = ?',
      [telefoneNumerico]
    );

    if (rows.length === 0) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        'Credenciais inválidas'
      );
    }

    const user = rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        'Credenciais inválidas'
      );
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json(
      successResponse(
        HttpStatus.OK,
        'Login realizado com sucesso',
        { 
          token,
          api_key: user.api_key
        }
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/usuarios/perfil:
 *   get:
 *     tags: [Usuários]
 *     summary: Retorna o perfil do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil retornado com sucesso
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
 *                   example: "Perfil recuperado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao@email.com"
 *                     telefone:
 *                       type: string
 *                       example: "63984193411"
 *                     data_criacao:
 *                       type: string
 *                       example: "2022-01-01T00:00:00.000Z"
 *                     status:
 *                       type: string
 *                       example: "ativo"
 *                     api_key:
 *                       type: string
 *                       example: "a1b2c3d4..."
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/perfil', auth, async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nome, email, telefone, data_criacao, status, api_key FROM usuarios WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Usuário não encontrado'
      );
    }

    res.json(
      successResponse(
        HttpStatus.OK,
        'Perfil recuperado com sucesso',
        users[0]
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/usuarios/regenerar-api-key:
 *   post:
 *     tags: [Usuários]
 *     summary: Regenera a API Key do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API Key regenerada com sucesso
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
 *                   example: "API Key regenerada com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     api_key:
 *                       type: string
 *                       example: "a1b2c3d4..."
 */
router.post('/regenerar-api-key', auth, async (req, res, next) => {
  try {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    await pool.execute(
      'UPDATE usuarios SET api_key = ? WHERE id = ?',
      [newApiKey, req.user.userId]
    );

    res.json(
      successResponse(
        HttpStatus.OK,
        'API Key regenerada com sucesso',
        { api_key: newApiKey }
      )
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
