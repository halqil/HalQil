import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, "Ism kamida 2 harf")
      .max(50, "Ism ko'pi bilan 50 harf")
      .regex(/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/, "Ism faqat harflardan iborat bo'lishi kerak"),
    lastName: z.string()
      .min(2, "Familya kamida 2 harf")
      .max(50, "Familya ko'pi bilan 50 harf")
      .regex(/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/, "Familya faqat harflardan iborat bo'lishi kerak"),
    phone: z.string()
      .regex(/^\+998[0-9]{9}$/, "Telefon raqam noto'g'ri (+998XXXXXXXXX)"),
    username: z.string()
      .min(3, "Username kamida 3 belgi")
      .max(30, "Username ko'pi bilan 30 belgi")
      .regex(/^[a-z0-9][a-z0-9_.]*[a-z0-9]$/, "Username faqat a-z, 0-9, _ va . bo'lishi mumkin"),
    password: z.string()
      .min(8, "Parol kamida 8 belgi")
      .regex(/(?=.*[a-z])/, "Kamida 1 ta kichik harf kerak")
      .regex(/(?=.*[A-Z])/, "Kamida 1 ta katta harf kerak")
      .regex(/(?=.*\d)/, "Kamida 1 ta raqam kerak"),
  })
});

export const loginSchema = z.object({
  body: z.object({
    login: z.string().min(1, "Login kiritish majburiy"),
    password: z.string().min(1, "Parol kiritish majburiy"),
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh tokenni kiriting'),
  })
});
