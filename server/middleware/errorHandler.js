// ---------- Centralized Error Handling ----------

/**
 * Custom error class for operational (expected) errors.
 * These are safe to return to the client.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); this.name = 'NotFoundError'; }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409); this.name = 'ConflictError'; }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') { super(message, 400); this.name = 'BadRequestError'; }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') { super(message, 503); this.name = 'ServiceUnavailableError'; }
}

/**
 * Express error-handling middleware.
 * Must be registered LAST with app.use(errorHandler).
 */
export function errorHandler(err, req, res, next) {
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB per file.' });
  }

  // Known operational errors — safe to return message to client
  if (err.isOperational) {
    const response = { error: err.message };
    if (err.details) response.details = err.details;
    return res.status(err.statusCode).json(response);
  }

  // Unknown / programmer errors — never leak internals to client
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

/**
 * Async route wrapper — catches thrown errors and passes to Express error handler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
