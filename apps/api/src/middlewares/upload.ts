import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { env } from '../config/env';

// ─── Cloudinary Configuration ──────────────────────────────────────────────────
let storage: multer.StorageEngine;
let avatarStorage: multer.StorageEngine;

if (env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET && env.CLOUDINARY_CLOUD_NAME) {
  // Use Cloudinary if credentials exist
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: 'halqil_uploads',
        format: 'jpg',
        public_id: `${file.fieldname}-${Date.now()}`,
      };
    },
  });

  avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: 'halqil_avatars',
        format: 'jpg',
        public_id: `avatar-${Date.now()}`,
      };
    },
  });
} else {
  // Local fallback
  const uploadDir = path.join(__dirname, env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const avatarsDir = path.join(__dirname, env.UPLOAD_DIR, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, avatarsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari ruxsat etiladi!'));
    }
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari ruxsat etiladi!'));
    }
  },
});
