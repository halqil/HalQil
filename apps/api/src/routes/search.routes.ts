import { Router } from 'express';
import { getProviders, getProviderDetail, getProviderSkillDetail } from '../controllers/search.controller';

const router = Router();

router.get('/', getProviders);
router.get('/:id', getProviderDetail);
router.get('/:id/skills/:skillId', getProviderSkillDetail);

export default router;
