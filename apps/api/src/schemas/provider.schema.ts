import { z } from 'zod';

export const applyProviderSchema = z.object({
  body: z.object({
    aboutMe: z.string().min(50, "aboutMe kamida 50 belgi bo'lishi kerak"),
    whyJoin: z.string().min(30, "whyJoin kamida 30 belgi bo'lishi kerak"),
    portfolioLink: z.string().url().optional().nullable(),
    workDistricts: z.array(z.string()).min(1, "Kamida 1 ta tuman tanlash kerak"),
    dailyLimit: z.number().min(1).max(50).optional().nullable(),
    categoryId: z.string().uuid("Noto'g'ri kategoriya ID formatda"),
    skills: z.array(
      z.object({
        skillId: z.string().uuid(),
        workMode: z.enum(['INDEPENDENT', 'ORGANIZED', 'UNORGANIZED', 'BOTH']),
        experienceYears: z.number().min(0.5).max(50),
        priceFrom: z.number().optional().nullable(),
        priceTo: z.number().optional().nullable(),
        description: z.string().min(20),
        portfolioImages: z.array(z.string()).optional()
      })
    ).optional()
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    districts: z.array(z.string()).optional()
  })
});

export const addSkillSchema = z.object({
  body: z.object({
    skill_id: z.string().uuid(),
    price_from: z.number().optional(),
    price_to: z.number().optional(),
    price_note: z.string().optional(),
    experience_years: z.number().min(0).max(60).optional(),
    description: z.string().optional()
  })
});

export const updateSkillSchema = z.object({
  body: z.object({
    price_from: z.number().optional().nullable(),
    price_to: z.number().optional().nullable(),
    price_note: z.string().optional().nullable(),
    experience_years: z.number().min(0).max(60).optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional()
  })
});

