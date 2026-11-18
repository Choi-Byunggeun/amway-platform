import { ensureSchema } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { ym, schedule } = body;

    if (!ym || !schedule) {
      return res.status(400).json({ error: '년월(ym)과 일정 데이터(schedule)가 필요합니다.' });
    }

    await db.execute({
      sql: 'INSERT INTO monthly_schedules (ym, data) VALUES (?, ?) ON CONFLICT(ym) DO UPDATE SET data = excluded.data',
      args: [String(ym), JSON.stringify(schedule)]
    });

    return res.status(200).json({ ym: String(ym) });
  } catch (err) {
    console.error('[api/schedules]', err);
    return res.status(500).json({ error: '일정 저장 중 오류가 발생했습니다.' });
  }
}
