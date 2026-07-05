import { Router, Response } from 'express';
import { db } from './db';
import { requireAuth, AuthRequest } from './middleware';

const router = Router();
router.use(requireAuth);

// ── GET /api/user-data ────────────────────────────────────────────────────────
router.get('/user-data', async (req: AuthRequest, res: Response) => {
  const userRes = await db.execute({ sql: 'SELECT status FROM users WHERE id = ?', args: [req.userId!] });
  if (!userRes.rows.length || userRes.rows[0].status !== 'approved') {
    return res.status(403).json({ error: 'Access not approved' });
  }

  const rowRes = await db.execute({
    sql:  'SELECT timetable, day_records, preferences FROM user_data WHERE user_id = ?',
    args: [req.userId!],
  });

  if (!rowRes.rows.length) {
    return res.json({ timetable: [], dayRecords: {}, preferences: {} });
  }
  const row = rowRes.rows[0];
  res.json({
    timetable:   JSON.parse(row.timetable as string),
    dayRecords:  JSON.parse(row.day_records as string),
    preferences: JSON.parse(row.preferences as string),
  });
});

// ── PUT /api/user-data ────────────────────────────────────────────────────────
router.put('/user-data', async (req: AuthRequest, res: Response) => {
  const userRes = await db.execute({ sql: 'SELECT status FROM users WHERE id = ?', args: [req.userId!] });
  if (!userRes.rows.length || userRes.rows[0].status !== 'approved') {
    return res.status(403).json({ error: 'Access not approved' });
  }

  const { timetable, dayRecords, preferences } = req.body as {
    timetable?: unknown[]; dayRecords?: Record<string, unknown>; preferences?: Record<string, unknown>;
  };

  await db.execute({
    sql: `INSERT INTO user_data (user_id, timetable, day_records, preferences, updated_at)
          VALUES (?, ?, ?, ?, unixepoch())
          ON CONFLICT(user_id) DO UPDATE SET
            timetable   = excluded.timetable,
            day_records = excluded.day_records,
            preferences = excluded.preferences,
            updated_at  = unixepoch()`,
    args: [
      req.userId!,
      JSON.stringify(timetable ?? []),
      JSON.stringify(dayRecords ?? {}),
      JSON.stringify(preferences ?? {}),
    ],
  });
  res.json({ ok: true });
});

export default router;
