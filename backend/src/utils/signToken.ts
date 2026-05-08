import jwt from 'jsonwebtoken';

export const createToken = (payload: { id: number; email: string; role: string }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
};
