import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    provider_id: z.string().uuid(),
    skill_id: z.string().uuid(),
    description: z.string().min(5, 'Tavsif kamida 5 ta harfdan iborat bo\'lishi kerak'),
    address: z.string().min(3, 'Manzilni kiriting'),
    preferred_time: z.string().optional(),
    images: z.array(z.string()).optional()
  })
});

export const rejectOrderSchema = z.object({
  body: z.object({
    reason: z.string().optional()
  })
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Bekor qilish sababini kiritish majburiy')
  })
});
