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
 * /api/usuarios/registro:
 *   post:
 *     tags: [Usuários]
 *     summary: Registra um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - telefone
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
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

    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? OR telefone = ?',
      [email, telefone]
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
      [nome, email, hashedSenha, telefone, apiKey]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ApiMessages.VALIDATION_ERROR,
        { message: 'Email e senha são obrigatórios' }
      );
    }

    const [users] = await pool.execute(
      'SELECT id, nome, email, senha, api_key FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        'Credenciais inválidas'
      );
    }

    const user = users[0];
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
