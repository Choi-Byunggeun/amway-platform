import { ensureSchema, sanitizePartner } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, id } = body;
    const partnerId = Number(id);

    if (!Number.isInteger(partnerId) || partnerId <= 0) {
      return res.status(400).json({ error: '유효한 파트너 ID가 필요합니다.' });
    }

    if (action === 'approve') {
      await db.execute({
        sql: "UPDATE partners SET status = 'approved', role = 'user' WHERE id = ?",
        args: [partnerId]
      });
      const updated = await db.execute({
        sql: 'SELECT id, name, email, role, status, date FROM partners WHERE id = ? LIMIT 1',
        args: [partnerId]
      });
      if (updated.rows.length === 0) {
        return res.status(404).json({ error: '파트너를 찾을 수 없습니다.' });
      }
      return res.status(200).json({ partner: sanitizePartner(updated.rows[0]) });
    }

    if (action === 'kick') {
      await db.execute({
        sql: "DELETE FROM partners WHERE id = ? AND role NOT IN ('super_admin', 'admin')",
        args: [partnerId]
      });
      return res.status(200).json({ deletedId: partnerId });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('[api/partners]', err);
    return res.status(500).json({ error: '파트너 관리 처리 중 오류가 발생했습니다.' });
  }
}
