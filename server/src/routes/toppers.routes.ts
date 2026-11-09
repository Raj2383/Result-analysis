import { Router } from 'express';
import { getToppers } from '../controllers/toppers.controller';

const router = Router();
router.get('/overall', getToppers);
router.get('/semester/:sem', getToppers);
router.get('/college/:code', getToppers);
router.get('/subject/:paperId', getToppers);

export default router;
