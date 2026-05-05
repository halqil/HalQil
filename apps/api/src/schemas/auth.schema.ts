import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak'),
    lastName: z.string().min(2, 'Familya kamida 2 ta harfdan iborat bo\'lishi kerak'),
    username: z.string().min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak'),
    email: z.string().email('Noto\'g\'ri email formati'),
    password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Noto\'g\'ri email formati'),
    password: z.string().min(1, 'Parolni kiriting'),
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh tokenni kiriting'),
  })
});
