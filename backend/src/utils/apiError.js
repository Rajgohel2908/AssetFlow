// ─── Custom API Error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Async handler wrapper ───────────────────────────────────────────────────
// Used as a fallback — express-async-errors handles this automatically,
// but this is available for explicit wrapping if needed.

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Validation helper ────────────────────────────────────────────────────────

export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors?.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
};

// ─── Query validation helper ─────────────────────────────────────────────────

export const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.query = await schema.parseAsync(req.query);
    next();
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: err.errors?.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
};
