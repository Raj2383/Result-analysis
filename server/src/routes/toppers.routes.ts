import { Router } from 'express';
import {
  getOverallToppers,
  getSemesterToppers,
  getCollegeToppers,
  getSubjectToppers,
} from '../controllers/toppers.controller';

const router = Router();
router.get('/overall', getOverallToppers);
router.get('/semester/:sem', getSemesterToppers);
router.get('/college/:code', getCollegeToppers);
router.get('/subject/:paperId', getSubjectToppers);

export default router;
