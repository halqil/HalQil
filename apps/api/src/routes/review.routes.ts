import { Router } from 'express';
import { createReview } from '../controllers/review.controller';
import { validate } from '../middlewares/validate';
import { createReviewSchema } from '../schemas/review.schema';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, validate(createReviewSchema), createReview);

export default router;
