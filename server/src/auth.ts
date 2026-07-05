import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from './db';

const router = Router();

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const JWT_SECRET           = process.env.JWT_SECRET ?? 'change-me-in-production';
const FRONTEND_URL         = process.env.FRONTEND_URL ?? 'http://localhost:5174';
const CALLBACK_URL         = process.env.CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback';
const OWNER_EMAIL          = 'utkarshkrishna.8@gmail.com';
const isProd               = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: 'lax' as const,
};

interface GoogleUserInfo {
  id: string; email: string; name: string; picture: string;
}

// ── GET /auth/google ──────────────────────────────────────────────────────────
router.get('/google', (_req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { ...COOKIE_OPTS, maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  CALLBACK_URL,
    response_type: 'code',
    scope:         'openid email profile',
    state,
    access_type:   'online',
    prompt:        'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /auth/google/callback ─────────────────────────────────────────────────
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;
  const savedState = req.cookies?.oauth_state as string | undefined;

  if (error || !code || !state || state !== savedState) {
    console.warn('[auth] OAuth failed:', error ?? 'state mismatch');
    return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
  }
  res.clearCookie('oauth_state');

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: CALLBACK_URL, grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokens.access_token) {
      console.error('[auth] Token exchange failed:', tokens.error);
      return res.redirect(`${FRONTEND_URL}?error=token_failed`);
    }

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const gUser = await profileRes.json() as GoogleUserInfo;
    const isOwner = gUser.email === OWNER_EMAIL;

    // Upsert user — preserve status for returning users
    await db.execute({
      sql: `INSERT INTO users (id, email, name, avatar_url, status, is_admin)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              email = excluded.email, name = excluded.name, avatar_url = excluded.avatar_url`,
      args: [gUser.id, gUser.email, gUser.name, gUser.picture,
             isOwner ? 'approved' : 'pending', isOwner ? 1 : 0],
    });

    // Always ensure owner is approved + admin
    if (isOwner) {
      await db.execute({
        sql:  `UPDATE users SET status = 'approved', is_admin = 1 WHERE id = ?`,
        args: [gUser.id],
      });
    }

    const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [gUser.id] });
    const user = result.rows[0];
    if (!user) return res.redirect(`${FRONTEND_URL}?error=server_error`);

    // Issue JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email, admin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('lp_session', token, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
    console.log(`[auth] Signed in: ${user.email} (${user.status})`);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('[auth] Callback error:', err);
    res.redirect(`${FRONTEND_URL}?error=server_error`);
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.lp_session;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const result  = await db.execute({
      sql:  'SELECT id, email, name, avatar_url, status, is_admin FROM users WHERE id = ?',
      args: [payload.sub],
    });
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({
      id:      u.id,   email:   u.email,  name:    u.name,
      avatarUrl: u.avatar_url, status: u.status, isAdmin: !!u.is_admin,
    });
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('lp_session');
  res.clearCookie('oauth_state');
  res.json({ ok: true });
});

export default router;
