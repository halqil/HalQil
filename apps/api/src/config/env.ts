import dotenv from 'dotenv';

dotenv.config();

const requiredEnvs = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_ORIGIN',
];

const checkRequiredEnvs = () => {
  const missing = requiredEnvs.filter((env) => !process.env[env]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1); // Fail fast in production
  }
};

// Faqatgina production yoki stagingda qat'iy tekshiramiz
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  checkRequiredEnvs();
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '../uploads',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};
