import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });
app.use('/api/v1/auth', authLimiter);

app.get('/api/v1/health', (_req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'OK' }));
app.use('/api/v1', apiRoutes);
app.use(notFound);
app.use(errorHandler);

// Serve the static ResultLens.html frontend (repo root) at GET /.
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'ResultLens.html'));
});

export { app };
export default app;
