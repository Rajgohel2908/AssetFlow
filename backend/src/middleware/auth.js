import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import prisma from '../lib/prisma.js';

// ─── JWT Authentication Middleware ────────────────────────────────────────────

/**
 * authenticate — verifies JWT access token from Authorization header.
 * Attaches req.user = { userId, role } on success.
 * Throws 401 if token is missing, malformed, or expired.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Access token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Attach minimal user info — no DB hit needed (JWT is self-contained)
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    return next(new ApiError(401, 'Invalid access token'));
  }
};

/**
 * authenticateWithUser — like authenticate, but also fetches the full user
 * from DB and attaches as req.fullUser. Use only on routes that need user details.
 */
export const authenticateWithUser = async (req, res, next) => {
  await authenticate(req, res, async (err) => {
    if (err) return next(err);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'User account is inactive or not found'));
    }

    req.fullUser = user;
    next();
  });
};
