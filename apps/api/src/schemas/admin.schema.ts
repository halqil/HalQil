import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Kategoriya nomi kamida 2 ta belgi bo\'lishi kerak'),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Kategoriya nomi kamida 2 ta belgi bo\'lishi kerak').optional(),
    description: z.string().optional(),
    icon: z.string().optional()
  })
});

export const createSkillSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Yaroqsiz kategoriya ID'),
    name: z.string().min(2, 'Skill nomi kamida 2 ta belgi bo\'lishi kerak'),
    description: z.string().optional()
  })
});

export const updateSkillSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Skill nomi kamida 2 ta belgi bo\'lishi kerak').optional(),
    description: z.string().optional()
  })
});
