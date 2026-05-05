import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  })
});
