import { Router } from 'express';
import overviewRoutes from './overview.routes';
import uploadRoutes from './upload.routes';
import resultRoutes from './result.routes';
import toppersRoutes from './toppers.routes';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import programmeRoutes from './programme.routes';

const router = Router();
router.use('/overview', overviewRoutes);
router.use('/uploads', uploadRoutes);
router.use('/results', resultRoutes);
router.use('/toppers', toppersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/programmes', programmeRoutes);
router.use('/courses', programmeRoutes);

export default router;
