import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

export interface JwtPayload {
  sub: string;   // Google user ID
  email: string;
  admin: boolean;
}

/** Extends Express Request with decoded JWT fields */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Verifies the lp_session httpOnly cookie and populates req.userId / req.isAdmin.
 * Returns 401 if missing or invalid.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.lp_session;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.isAdmin = payload.admin;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/**
 * Must run after requireAuth.
 * Returns 403 if the admin flag is not set in the JWT.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
