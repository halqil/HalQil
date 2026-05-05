import { Router } from 'express';
import { getCategories, getSkills } from '../controllers/admin.controller';

const router = Router();

// Public endpoints — no auth required
router.get('/categories', getCategories);
router.get('/skills', getSkills);

export default router;
