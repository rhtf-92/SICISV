import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import type { AuthenticatedRequest, JwtPayload } from '../types';

const FALLBACK_SECRET = 'your_super_secret_jwt_key_change_in_production';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  console.error('FATAL ERROR: JWT_SECRET is not configured or is using the development fallback key in production environment!');
  process.exit(1);
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;

    req.userId = decoded.userId;
    req.username = decoded.username;
    req.role = decoded.role;

    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authorize(roles: string[]) {
  return function (req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.role) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
