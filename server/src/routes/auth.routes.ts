import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', auth, me);

export default router;
