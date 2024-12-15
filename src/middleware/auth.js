const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { HttpStatus } = require('../utils/apiResponse');
const { AppError } = require('./errorHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Token não fornecido');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Token não fornecido');
    }

    // Primeiro tenta verificar se é uma API Key
    const [users] = await pool.execute(
      'SELECT id, status FROM usuarios WHERE api_key = ? AND status = "ativo"',
      [token]
    );

    if (users.length > 0) {
      req.user = {
        userId: users[0].id,
        type: 'api'
      };
      return next();
    }

    // Se não é API Key, tenta verificar se é um JWT válido
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verifica se o usuário está ativo
      const [activeUsers] = await pool.execute(
        'SELECT id FROM usuarios WHERE id = ? AND status = "ativo"',
        [decoded.userId]
      );

      if (activeUsers.length === 0) {
        throw new AppError(HttpStatus.UNAUTHORIZED, 'Usuário inativo ou não encontrado');
      }

      req.user = decoded;
      next();
    } catch (jwtError) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Token inválido');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
