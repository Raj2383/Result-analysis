import { Router } from 'express';
import { searchStudents, getStudentResult } from '../controllers/result.controller';

const router = Router();
router.get('/search', searchStudents);
router.get('/:rollNo', getStudentResult);

export default router;
