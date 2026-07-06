import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './db';
import authRouter  from './auth';
import adminRouter from './admin';
import dataRouter  from './data';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5174';

// ── Middleware ────────────────────────────────────────────────────────────────
// Capacitor Android WebView sends requests from 'capacitor://localhost' (or
// 'http://localhost' on some devices), which is different from FRONTEND_URL.
// We must allowlist both so API calls from the APK aren't CORS-blocked.
const ALLOWED_ORIGINS = new Set([
  FRONTEND_URL,
  'capacitor://localhost',  // Capacitor Android (v3+)
  'http://localhost',       // Capacitor Android fallback / iOS simulator
  'https://localhost',      // Capacitor iOS
]);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin server calls)
    if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,  // required for cookies
}));

app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',        authRouter);
app.use('/api/admin',   adminRouter);  // mount before /api (more specific path)
app.use('/api',         dataRouter);

// Health check (used by deploy to verify server is up)
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Life Planner API → http://0.0.0.0:${PORT}`);
    console.log(`   Frontend URL : ${FRONTEND_URL}`);
    console.log(`   NODE_ENV     : ${process.env.NODE_ENV ?? 'development'}`);
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
