import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate random code (for invite codes)
export const generateCode = (length: number = 8): string => {
  return crypto.randomBytes(length).toString('hex').substring(0, length).toUpperCase();
};

// Hash token (for storing refresh tokens)
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Re-export date utilities from dateUtils (GMT+8)
export {
  daysUntil,
  formatDate,
  getCurrentDateTimeISO,
  getCurrentDate,
  toGMT8ISO,
  toGMT8DateString
} from './dateUtils';

// Parse pagination params
export const parsePagination = (page?: string, limit?: string) => {
  const pageNum = parseInt(page || '1');
  const limitNum = parseInt(limit || '50');
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    offset: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum)),
  };
};

