import crypto from 'node:crypto';
import { ensureSchema, hashPassword, sanitizePartner, verifyPassword } from './_db.js';

async function verifyGoogleIdToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    throw new Error('유효하지 않은 구글 인증 토큰입니다.');
  }
  const info = await res.json();
  const expectedClientId = process.env.GOOGLE_CLIENT_ID;
  if (expectedClientId && info.aud !== expectedClientId) {
    throw new Error('구글 클라이언트 ID가 일치하지 않습니다.');
  }
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    throw new Error('이메일 인증이 완료되지 않은 구글 계정입니다.');
  }
  return {
    email: String(info.email || '').trim().toLowerCase(),
    name: String(info.name || info.email || '').trim()
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, email, password, name, inviteCode, googleEmail, idToken } = body;

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: '아이디(이메일)와 비밀번호를 입력해주세요.' });
      }
      const cleanEmail = String(email).trim();
      const result = await db.execute({
        sql: 'SELECT id, name, email, password, role, status, date, google_email FROM partners WHERE LOWER(email) = LOWER(?) LIMIT 1',
        args: [cleanEmail]
      });
      const user = result.rows[0];
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: '아이디(이메일) 또는 비밀번호가 일치하지 않습니다.' });
      }
      if (String(user.status) === 'pending') {
        return res.status(403).json({ error: '관리자 승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다.' });
      }
      // Upgrade legacy plaintext password to scrypt hash on first successful login
      if (!String(user.password).startsWith('scrypt:')) {
        await db.execute({
          sql: 'UPDATE partners SET password = ? WHERE id = ?',
          args: [hashPassword(password), Number(user.id)]
        });
      }
      return res.status(200).json({ user: sanitizePartner(user) });
    }

    if (action === 'register') {
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim();
      const cleanPassword = String(password || '').trim();
      const cleanInvite = String(inviteCode || '').trim().toUpperCase();
      const cleanGoogleEmail = String(googleEmail || '').trim().toLowerCase() || null;

      if (!cleanName || !cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: '이름, 아이디(이메일), 비밀번호를 모두 입력해주세요.' });
      }
      if (cleanPassword.length < 4) {
        return res.status(400).json({ error: '비밀번호는 4자 이상으로 입력해주세요.' });
      }

      const existing = await db.execute({
        sql: 'SELECT id FROM partners WHERE LOWER(email) = LOWER(?) LIMIT 1',
        args: [cleanEmail]
      });
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: '이미 신청되었거나 가입된 아이디(이메일)입니다.' });
      }

      let isCodeValid = false;
      if (cleanInvite) {
        const inviteRes = await db.execute({
          sql: 'SELECT value FROM app_settings WHERE key = ? LIMIT 1',
          args: ['team_invite_code']
        });
        const currentInviteCode = String(inviteRes.rows[0]?.value || '').toUpperCase();
        isCodeValid = Boolean(currentInviteCode && cleanInvite === currentInviteCode);
      }

      const role = isCodeValid ? 'user' : 'guest';
      const status = isCodeValid ? 'approved' : 'pending';
      const today = new Date().toISOString().split('T')[0];

      const insertRes = await db.execute({
        sql: 'INSERT INTO partners (name, email, password, role, status, date, google_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [cleanName, cleanEmail, hashPassword(cleanPassword), role, status, today, cleanGoogleEmail]
      });

      const created = {
        id: Number(insertRes.lastInsertRowid),
        name: cleanName,
        email: cleanEmail,
        role,
        status,
        date: today,
        googleEmail: cleanGoogleEmail || ''
      };

      return res.status(201).json({ user: created, autoApproved: isCodeValid });
    }

    if (action === 'google_login') {
      if (!idToken) {
        return res.status(400).json({ error: '구글 인증 토큰이 필요합니다.' });
      }
      const gUser = await verifyGoogleIdToken(idToken);
      const result = await db.execute({
        sql: 'SELECT id, name, email, role, status, date, google_email FROM partners WHERE LOWER(google_email) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1',
        args: [gUser.email, gUser.email]
      });
      const existing = result.rows[0];

      if (existing) {
        if (!existing.google_email) {
          await db.execute({
            sql: 'UPDATE partners SET google_email = ? WHERE id = ?',
            args: [gUser.email, Number(existing.id)]
          });
        }
        if (String(existing.status) === 'pending') {
          return res.status(403).json({ error: '구글 계정은 등록되었으나 현재 관리자 승인 대기 중입니다.' });
        }
        return res.status(200).json({
          user: { ...sanitizePartner(existing), googleEmail: gUser.email }
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const randomPw = hashPassword(crypto.randomBytes(24).toString('hex'));
      const insertRes = await db.execute({
        sql: 'INSERT INTO partners (name, email, password, role, status, date, google_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [gUser.name, gUser.email, randomPw, 'guest', 'pending', today, gUser.email]
      });

      return res.status(202).json({
        pending: true,
        user: {
          id: Number(insertRes.lastInsertRowid),
          name: gUser.name,
          email: gUser.email,
          role: 'guest',
          status: 'pending',
          date: today,
          googleEmail: gUser.email
        },
        message: '구글 계정으로 가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.'
      });
    }

    if (action === 'link_google') {
      const cleanEmail = String(email || '').trim();
      const cleanGoogleEmail = String(googleEmail || '').trim().toLowerCase();
      if (!cleanEmail || !cleanGoogleEmail || !cleanGoogleEmail.includes('@')) {
        return res.status(400).json({ error: '유효한 구글 이메일 주소를 입력해주세요.' });
      }
      await db.execute({
        sql: 'UPDATE partners SET google_email = ? WHERE LOWER(email) = LOWER(?)',
        args: [cleanGoogleEmail, cleanEmail]
      });
      const updated = await db.execute({
        sql: 'SELECT id, name, email, role, status, date, google_email FROM partners WHERE LOWER(email) = LOWER(?) LIMIT 1',
        args: [cleanEmail]
      });
      if (updated.rows.length === 0) {
        return res.status(404).json({ error: '계정을 찾을 수 없습니다.' });
      }
      return res.status(200).json({ user: sanitizePartner(updated.rows[0]) });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('[api/auth]', err);
    return res.status(500).json({ error: err.message || '인증 처리 중 오류가 발생했습니다.' });
  }
}
