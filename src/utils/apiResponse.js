/**
 * Códigos de status HTTP padronizados
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Códigos de status da aplicação
 */
const ApiStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAIL: 'fail',
};

/**
 * Mensagens padrão da API
 */
const ApiMessages = {
  SUCCESS: 'Operação realizada com sucesso',
  CREATED: 'Registro criado com sucesso',
  UPDATED: 'Registro atualizado com sucesso',
  DELETED: 'Registro removido com sucesso',
  NOT_FOUND: 'Registro não encontrado',
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  VALIDATION_ERROR: 'Erro de validação',
  INTERNAL_ERROR: 'Erro interno do servidor',
};

/**
 * Formata a resposta de sucesso
 * @param {number} statusCode - Código HTTP
 * @param {string} message - Mensagem de sucesso
 * @param {*} data - Dados da resposta
 * @param {*} metadata - Metadados adicionais (paginação, etc)
 */
const successResponse = (statusCode, message, data = null, metadata = null) => {
  const response = {
    status: ApiStatus.SUCCESS,
    code: statusCode,
    message,
  };

  if (data) response.data = data;
  if (metadata) response.metadata = metadata;

  return response;
};

/**
 * Formata a resposta de erro
 * @param {number} statusCode - Código HTTP
 * @param {string} message - Mensagem de erro
 * @param {*} errors - Detalhes dos erros
 */
const errorResponse = (statusCode, message, errors = null) => {
  const response = {
    status: ApiStatus.ERROR,
    code: statusCode,
    message,
  };

  if (errors) response.errors = errors;

  return response;
};

/**
 * Formata a resposta de falha (erro de validação)
 * @param {number} statusCode - Código HTTP
 * @param {string} message - Mensagem de falha
 * @param {*} failures - Detalhes das falhas
 */
const failResponse = (statusCode, message, failures = null) => {
  const response = {
    status: ApiStatus.FAIL,
    code: statusCode,
    message,
  };

  if (failures) response.failures = failures;

  return response;
};

module.exports = {
  HttpStatus,
  ApiStatus,
  ApiMessages,
  successResponse,
  errorResponse,
  failResponse,
};
