import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, "Ism kamida 2 harf bo'lishi kerak")
      .max(50, "Ism ko'pi bilan 50 harf")
      .regex(/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/, "Ism faqat harflardan iborat bo'lishi kerak"),

    lastName: z.string()
      .min(2, "Familya kamida 2 harf bo'lishi kerak")
      .max(50, "Familya ko'pi bilan 50 harf")
      .regex(/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/, "Familya faqat harflardan iborat bo'lishi kerak"),

    phone: z.string()
      .regex(/^\+998[0-9]{9}$/, "Telefon raqam noto'g'ri formatda (+998XXXXXXXXX)"),

    username: z.string()
      .min(3, "Username kamida 3 belgi bo'lishi kerak")
      .max(30, "Username ko'pi bilan 30 belgi")
      .regex(
        /^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$|^[a-z0-9]{3}$/,
        "Username faqat a-z, 0-9, _ va . bo'lishi mumkin"
      ),

    password: z.string()
      .min(8, "Parol kamida 8 belgi bo'lishi kerak")
      .regex(/(?=.*[a-z])/, "Kamida 1 ta kichik harf bo'lishi kerak")
      .regex(/(?=.*[A-Z])/, "Kamida 1 ta katta harf bo'lishi kerak")
      .regex(/(?=.*\d)/, "Kamida 1 ta raqam bo'lishi kerak"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    login: z.string().min(1, "Login kiritish majburiy"),
    password: z.string().min(1, "Parol kiritish majburiy"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh tokenni kiriting'),
  }),
});

export const checkUsernameSchema = z.object({
  query: z.object({
    username: z.string().min(1),
  }),
});

export const checkPhoneSchema = z.object({
  query: z.object({
    phone: z.string().min(1),
  }),
});
