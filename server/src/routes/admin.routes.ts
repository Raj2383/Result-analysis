import { Router } from 'express';
import { createFacultyController, adminListUploads } from '../controllers/admin.controller';

const router = Router();
router.post('/faculty', createFacultyController);
router.get('/uploads', adminListUploads);

export default router;
