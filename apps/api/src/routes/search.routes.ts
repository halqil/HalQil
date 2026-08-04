import { Router } from 'express';
import { getProviders, getProviderDetail, getProviderSkillDetail, unifiedSearch } from '../controllers/search.controller';

const router = Router();

router.get('/unified', unifiedSearch);
router.get('/', getProviders);
router.get('/:id', getProviderDetail);
router.get('/:id/skills/:skillId', getProviderSkillDetail);

export default router;
