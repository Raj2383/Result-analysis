import { Router } from 'express';
import { uploadPdfController, uploadHistory, deleteUploadController } from '../controllers/upload.controller';
import { auth, requireRole } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const router = Router();
router.post('/', auth, requireRole('faculty', 'admin'), upload.single('pdf'), uploadPdfController);
router.get('/', auth, uploadHistory);
router.delete('/:id', auth, requireRole('faculty', 'admin'), deleteUploadController);

export default router;
