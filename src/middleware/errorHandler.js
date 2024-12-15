const { HttpStatus, ApiMessages, errorResponse } = require('../utils/apiResponse');

class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.statusCode, err.message, err.errors)
    );
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(HttpStatus.UNAUTHORIZED).json(
      errorResponse(HttpStatus.UNAUTHORIZED, 'Token inválido')
    );
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(HttpStatus.UNAUTHORIZED).json(
      errorResponse(HttpStatus.UNAUTHORIZED, 'Token expirado')
    );
  }

  // Erro de validação do MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(HttpStatus.CONFLICT).json(
      errorResponse(HttpStatus.CONFLICT, 'Registro duplicado')
    );
  }

  // Erro interno do servidor
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
    errorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ApiMessages.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    )
  );
};

module.exports = {
  AppError,
  errorHandler,
};
