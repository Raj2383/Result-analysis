import { Router } from 'express';
import { uploadPdfController, uploadHistory } from '../controllers/upload.controller';

const router = Router();
router.post('/', uploadPdfController);
router.get('/', uploadHistory);

export default router;
