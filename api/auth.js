import { ensureSchema, sanitizePartner } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, email, password, name, inviteCode } = body;

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
      }
      const result = await db.execute({
        sql: 'SELECT id, name, email, password, role, status, date FROM partners WHERE LOWER(email) = LOWER(?) LIMIT 1',
        args: [String(email).trim()]
      });
      const user = result.rows[0];
      if (!user || String(user.password) !== String(password).trim()) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' });
      }
      if (String(user.status) === 'pending') {
        return res.status(403).json({ error: '현재 총괄 관리자(2인) 승인 대기 중인 계정입니다. 승인 후 이용 가능합니다.' });
      }
      return res.status(200).json({ user: sanitizePartner(user) });
    }

    if (action === 'register') {
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim();
      const cleanPassword = String(password || '').trim();
      const cleanInvite = String(inviteCode || '').trim().toUpperCase();

      if (!cleanName || !cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' });
      }

      const existing = await db.execute({
        sql: 'SELECT id FROM partners WHERE LOWER(email) = LOWER(?) LIMIT 1',
        args: [cleanEmail]
      });
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: '이미 가입된 이메일 주소입니다.' });
      }

      const inviteRes = await db.execute({
        sql: 'SELECT value FROM app_settings WHERE key = ? LIMIT 1',
        args: ['team_invite_code']
      });
      const currentInviteCode = String(inviteRes.rows[0]?.value || 'DIAMOND2026').toUpperCase();
      const isCodeValid = cleanInvite === currentInviteCode;
      const role = isCodeValid ? 'user' : 'guest';
      const status = isCodeValid ? 'approved' : 'pending';
      const today = new Date().toISOString().split('T')[0];

      const insertRes = await db.execute({
        sql: 'INSERT INTO partners (name, email, password, role, status, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [cleanName, cleanEmail, cleanPassword, role, status, today]
      });

      const created = {
        id: Number(insertRes.lastInsertRowid),
        name: cleanName,
        email: cleanEmail,
        role,
        status,
        date: today
      };

      return res.status(201).json({ user: created, autoApproved: isCodeValid });
    }

    if (action === 'social_mock') {
      const result = await db.execute(
        "SELECT id, name, email, role, status, date FROM partners WHERE email IN ('geun0123@naver.com', 'user@abo.com') ORDER BY id ASC LIMIT 1"
      );
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: '기본 계정을 찾을 수 없습니다.' });
      }
      return res.status(200).json({ user: sanitizePartner(user) });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('[api/auth]', err);
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
}
