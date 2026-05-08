import { Router } from 'express';
import { contactSupport } from '../controllers/support.controller';

const router = Router();

router.post('/contact', contactSupport);

export default router;
