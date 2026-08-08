import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * @desc    Generate access and refresh tokens
 */
export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

/**
 * @desc    Verify access token and return payload
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * @desc    Verify refresh token and return payload
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
