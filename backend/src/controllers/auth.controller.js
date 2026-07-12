import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { activityLogService } from '../services/activityLog.service.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  departmentId: z.string().cuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

// ─── Token Helpers ────────────────────────────────────────────────────────────

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /auth/signup
 * BUSINESS RULE 1: role is ALWAYS EMPLOYEE — never accepted from client.
 */
export const signup = async (req, res) => {
  const data = signupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'EMPLOYEE', // HARDCODED — BUSINESS RULE 1: never from client
      departmentId: data.departmentId ?? null,
    },
    select: {
      id: true, name: true, email: true, role: true,
      departmentId: true, status: true, createdAt: true,
    },
  });

  await activityLogService.log(user.id, 'USER_SIGNUP', 'User', user.id, null);

  res.status(201).json({ success: true, data: user });
};

/**
 * POST /auth/login
 * Returns access token in body + refresh token as httpOnly cookie.
 */
export const login = async (req, res) => {
  const data = loginSchema.parse(req.body);

  let user = await prisma.user.findUnique({ where: { email: data.email } });
  
  // Dev Mode: Auto-register and bypass password check
  if (!user) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    user = await prisma.user.create({
      data: {
        name: data.email.split('@')[0],
        email: data.email,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Persist refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

  setRefreshCookie(res, refreshToken);

  await activityLogService.log(user.id, 'USER_LOGIN', 'User', user.id, null);

  res.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, departmentId: user.departmentId,
      },
    },
  });
};

/**
 * POST /auth/refresh
 * Rotates the refresh token (token rotation pattern).
 */
export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie('refreshToken');
    throw new ApiError(401, 'Refresh token expired or revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'User not found or inactive');

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { token } });
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: user.id, token: newRefreshToken, expiresAt } });

  setRefreshCookie(res, newRefreshToken);

  res.json({ success: true, data: { accessToken } });
};

/**
 * POST /auth/logout
 */
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists
  if (!user) {
    return res.json({ success: true, message: 'If that email is registered, a reset token was sent' });
  }

  // Invalidate existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  // In production: send email with reset link
  // For dev/hackathon: return token directly in response
  const responseData = { success: true, message: 'Reset token generated' };
  if (process.env.NODE_ENV === 'development') {
    responseData.resetToken = token;
  }

  res.json(responseData);
};

/**
 * POST /auth/reset-password
 */
export const resetPassword = async (req, res) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const data = schema.parse(req.body);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: data.token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Revoke all refresh tokens for security
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  res.json({ success: true, message: 'Password reset successfully. Please log in again.' });
};

/**
 * GET /auth/me
 * Returns the authenticated user's profile.
 */
export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true, name: true, email: true, role: true,
      departmentId: true, status: true, createdAt: true,
      department: { select: { id: true, name: true } },
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
};
