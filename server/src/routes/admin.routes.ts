import { Router } from 'express';
import { createFacultyController, adminListUploads } from '../controllers/admin.controller';
import { auth, requireRole } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createFacultySchema } from '../validators/admin.validators';

const router = Router();
router.post('/faculty', auth, requireRole('admin'), validate({ body: createFacultySchema }), createFacultyController);
router.get('/uploads', auth, requireRole('admin'), adminListUploads);

export default router;
