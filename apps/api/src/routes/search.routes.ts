import { Router } from 'express';
import { getProviders, getProviderDetail } from '../controllers/search.controller';

const router = Router();

router.get('/', getProviders);
router.get('/:id', getProviderDetail);

export default router;
