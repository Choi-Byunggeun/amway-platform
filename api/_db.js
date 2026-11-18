import { createClient } from '@libsql/client';

let client = null;
let schemaReady = false;

const DEFAULT_PARTNERS = [
  ['최병근 리더(총괄마스터)', 'geun0123@naver.com', '1234', 'super_admin', 'approved', '2026-01-01'],
  ['총괄마스터 2(파트너)', 'master2@abo.com', 'manager', 'super_admin', 'approved', '2026-01-01'],
  ['김리더', 'user@abo.com', 'user', 'user', 'approved', '2026-02-15'],
  ['이파트너', 'partner1@abo.com', 'password', 'user', 'approved', '2026-08-01'],
  ['박파트너', 'partner2@abo.com', 'password', 'user', 'approved', '2026-08-10'],
  ['신규신청자(코드없음)', 'pending@abo.com', 'password', 'guest', 'pending', '2026-10-23']
];

export function getDb() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is not configured');
  }
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }
  return client;
}

export async function ensureSchema() {
  const db = getDb();
  if (schemaReady) return db;

  await db.batch([
    `CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'guest',
      status TEXT NOT NULL DEFAULT 'pending',
      date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS monthly_schedules (
      ym TEXT PRIMARY KEY,
      data TEXT NOT NULL
    )`
  ], 'write');

  const countRes = await db.execute('SELECT COUNT(*) AS cnt FROM partners');
  const count = Number(countRes.rows[0]?.cnt ?? 0);
  if (count === 0) {
    for (const row of DEFAULT_PARTNERS) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO partners (name, email, password, role, status, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: row
      });
    }
  }

  await db.execute({
    sql: 'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
    args: ['team_invite_code', 'DIAMOND2026']
  });

  schemaReady = true;
  return db;
}

export function sanitizePartner(row) {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role),
    status: String(row.status),
    date: String(row.date)
  };
}
