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
    sql:  'SELECT timetable, preferences FROM user_data WHERE user_id = ?',
    args: [req.userId!],
  });

  const dayRecordsRes = await db.execute({
    sql:  'SELECT date, tasks, notes, wins, improvements, completion_percentage FROM day_records WHERE user_id = ?',
    args: [req.userId!],
  });

  const dayRecords: Record<string, any> = {};
  for (const row of dayRecordsRes.rows) {
    dayRecords[row.date as string] = {
      date: row.date,
      tasks: JSON.parse(row.tasks as string),
      notes: row.notes,
      wins: row.wins,
      improvements: row.improvements,
      completionPercentage: Number(row.completion_percentage),
    };
  }

  if (!rowRes.rows.length) {
    return res.json({ timetable: null, dayRecords, preferences: {} });
  }
  const row = rowRes.rows[0];
  res.json({
    timetable:   JSON.parse(row.timetable as string),
    dayRecords,
    preferences: JSON.parse(row.preferences as string),
  });
});

// ── PUT /api/user-data ────────────────────────────────────────────────────────
router.put('/user-data', async (req: AuthRequest, res: Response) => {
  const userRes = await db.execute({ sql: 'SELECT status FROM users WHERE id = ?', args: [req.userId!] });
  if (!userRes.rows.length || userRes.rows[0].status !== 'approved') {
    return res.status(403).json({ error: 'Access not approved' });
  }

  const { timetable, preferences } = req.body as {
    timetable?: unknown[]; preferences?: Record<string, unknown>;
  };

  // Fetch current values to keep them if not provided
  const oldRowRes = await db.execute({
    sql: 'SELECT timetable, preferences FROM user_data WHERE user_id = ?',
    args: [req.userId!]
  });

  let currentTimetableStr = '[]';
  let currentPreferencesStr = '{}';

  if (oldRowRes.rows.length) {
    currentTimetableStr = oldRowRes.rows[0].timetable as string;
    currentPreferencesStr = oldRowRes.rows[0].preferences as string;
  }

  const finalTimetable = timetable !== undefined ? JSON.stringify(timetable) : currentTimetableStr;
  const finalPreferences = preferences !== undefined ? JSON.stringify(preferences) : currentPreferencesStr;

  await db.execute({
    sql: `INSERT INTO user_data (user_id, timetable, preferences, updated_at)
          VALUES (?, ?, ?, unixepoch())
          ON CONFLICT(user_id) DO UPDATE SET
            timetable   = excluded.timetable,
            preferences = excluded.preferences,
            updated_at  = unixepoch()`,
    args: [
      req.userId!,
      finalTimetable,
      finalPreferences,
    ],
  });
  res.json({ ok: true });
});

// ── PUT /api/user-data/day-record ─────────────────────────────────────────────
router.put('/user-data/day-record', async (req: AuthRequest, res: Response) => {
  const userRes = await db.execute({ sql: 'SELECT status FROM users WHERE id = ?', args: [req.userId!] });
  if (!userRes.rows.length || userRes.rows[0].status !== 'approved') {
    return res.status(403).json({ error: 'Access not approved' });
  }

  const { date, record } = req.body as {
    date: string;
    record: {
      tasks?: unknown[];
      notes?: string;
      wins?: string;
      improvements?: string;
      completionPercentage?: number;
    };
  };

  if (!date || !record) {
    return res.status(400).json({ error: 'Missing date or record' });
  }

  await db.execute({
    sql: `INSERT OR REPLACE INTO day_records (
            user_id, date, tasks, notes, wins, improvements, completion_percentage
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      req.userId!,
      date,
      JSON.stringify(record.tasks ?? []),
      record.notes ?? '',
      record.wins ?? '',
      record.improvements ?? '',
      record.completionPercentage ?? 0,
    ],
  });

  res.json({ ok: true });
});

export default router;
