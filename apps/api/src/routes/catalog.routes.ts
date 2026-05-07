import { Router } from 'express';
import { getCategories, getSkills } from '../controllers/admin.controller';
import { getDistricts } from '../controllers/catalog.controller';

const router = Router();

// Public endpoints — no auth required
router.get('/categories', getCategories);
router.get('/skills', getSkills);
router.get('/districts', getDistricts);

export default router;
