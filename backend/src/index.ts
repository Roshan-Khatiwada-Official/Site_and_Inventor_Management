import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { readAppData, writeAppData } from './lib/sync.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const API_TOKEN = process.env.API_TOKEN || '';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '25mb' })); // whole-dataset payloads can be sizeable

// Same shared-secret model the old Google Sheets bridge used — the token is
// still shipped in the frontend bundle (anyone who can open the app can
// call the API), so it's a barrier against random internet scanners, not a
// substitute for real per-user auth. Skipped entirely if API_TOKEN is unset
// (local dev), so this is a no-op until a token is actually configured.
app.use((req, res, next) => {
  if (!API_TOKEN || req.path === '/health') return next();
  const provided = req.header('x-api-token') || (req.body && req.body.token);
  if (provided !== API_TOKEN) return res.status(401).json({ ok: false, error: 'Unauthorized: bad token' });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: String(err) });
  }
});

// Same full-read / full-write contract the old Google Sheets bridge had
// (see frontend/src/services/sheetsBridge.ts) — the frontend's own
// three-way-merge/conflict logic already assumes this shape, so it needs no
// change beyond pointing at this URL instead.
app.get('/api/data', async (_req, res) => {
  try {
    const data = await readAppData();
    res.json({ ok: true, data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/data failed:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    await writeAppData(req.body?.data ?? req.body);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('POST /api/data failed:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`siteops-backend listening on http://localhost:${PORT}`);
});
