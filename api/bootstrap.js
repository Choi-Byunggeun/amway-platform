import { ensureSchema, sanitizePartner } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await ensureSchema();
    const [partnersRes, settingsRes, schedulesRes] = await Promise.all([
      db.execute('SELECT id, name, email, role, status, date FROM partners ORDER BY id ASC'),
      db.execute('SELECT key, value FROM app_settings'),
      db.execute('SELECT ym, data FROM monthly_schedules')
    ]);

    const settings = {};
    for (const row of settingsRes.rows) {
      settings[String(row.key)] = String(row.value);
    }

    const customSchedules = {};
    for (const row of schedulesRes.rows) {
      try {
        customSchedules[String(row.ym)] = JSON.parse(String(row.data));
      } catch {
        // Ignore malformed schedule JSON
      }
    }

    return res.status(200).json({
      partners: partnersRes.rows.map(sanitizePartner),
      teamInviteCode: settings.team_invite_code || 'DIAMOND2026',
      googleDriveFolderUrl: settings.google_drive_url || '',
      customSchedules
    });
  } catch (err) {
    console.error('[api/bootstrap]', err);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}
