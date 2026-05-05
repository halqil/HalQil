import { z } from 'zod';

export const applyProviderSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    skill_ids: z.array(z.string().uuid()),
    districts: z.array(z.string()),
    price_notes: z.array(
      z.object({
        skill_id: z.string().uuid(),
        price_from: z.number().optional(),
        price_to: z.number().optional(),
        experience_years: z.number().min(0).max(60)
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
    experience_years: z.number().min(0).max(60).optional()
  })
});
