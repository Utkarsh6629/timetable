import { Router, Response } from 'express';
import { db } from './db';
import { requireAuth, requireAdmin, AuthRequest } from './middleware';

const router = Router();
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (_req: AuthRequest, res: Response) => {
  const result = await db.execute(`
    SELECT id, email, name, avatar_url, status, is_admin, created_at
    FROM users
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC
  `);
  res.json(result.rows.map(u => ({
    id:        u.id,
    email:     u.email,
    name:      u.name,
    avatarUrl: u.avatar_url,
    status:    u.status,
    isAdmin:   !!u.is_admin,
    createdAt: u.created_at,
  })));
});

// ── PATCH /api/admin/users/:id ────────────────────────────────────────────────
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !['approved', 'denied', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved | denied | pending' });
  }

  const targetRes = await db.execute({ sql: 'SELECT is_admin FROM users WHERE id = ?', args: [id] });
  if (!targetRes.rows.length) return res.status(404).json({ error: 'User not found' });
  if (targetRes.rows[0].is_admin)  return res.status(403).json({ error: 'Cannot change admin status' });

  await db.execute({ sql: 'UPDATE users SET status = ? WHERE id = ?', args: [status, id] });
  console.log(`[admin] User ${id} → ${status} by ${req.userId}`);
  res.json({ ok: true });
});

export default router;
