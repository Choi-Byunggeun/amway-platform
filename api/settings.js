import { ensureSchema } from './_db.js';

const ALLOWED_KEYS = new Set(['team_invite_code', 'google_drive_url']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { key, value } = body;

    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: '허용되지 않은 설정 키입니다.' });
    }

    const cleanValue = key === 'team_invite_code'
      ? String(value || '').trim().toUpperCase()
      : String(value || '').trim();

    if (!cleanValue) {
      return res.status(400).json({ error: '설정 값이 비어 있습니다.' });
    }

    await db.execute({
      sql: 'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [key, cleanValue]
    });

    return res.status(200).json({ key, value: cleanValue });
  } catch (err) {
    console.error('[api/settings]', err);
    return res.status(500).json({ error: '설정 저장 중 오류가 발생했습니다.' });
  }
}
