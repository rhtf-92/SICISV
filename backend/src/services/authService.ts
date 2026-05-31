import { prisma } from '../config/database';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';

const FALLBACK_SECRET = 'your_super_secret_jwt_key_change_in_production';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  console.error('FATAL ERROR: JWT_SECRET is not configured or is using the development fallback key in production environment!');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  role: z.enum(['guard', 'support', 'admin']).default('guard'),
});

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
      },
    });

    const token = sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    const isValid = await compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }
}
