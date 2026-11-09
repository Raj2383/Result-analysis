import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';

const router = Router();
router.get('/summary', getAnalytics);
router.get('/college-sgpa', getAnalytics);
router.get('/subject-pass-rate', getAnalytics);

export default router;
