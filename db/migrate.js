/* NABD — migration runner.
   Usage:
     npm run migrate            # applies all pending migrations
     node db/migrate.js --dry   # prints pending migrations only

   Also used by the Postgres store to lazily ensure the schema exists
   (idempotent — safe to run on every cold start). */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations(pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = new Set(
    (await pool.query('SELECT name FROM _migrations')).rows.map((r) => r.name)
  );

  const pending = files.filter((f) => !applied.has(f));
  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error('migration ' + file + ' failed: ' + e.message);
    } finally {
      client.release();
    }
    if (typeof console !== 'undefined') console.log('[nabd-migrate] applied ' + file);
  }
  return pending.length;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not configured.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    const dry = process.argv.indexOf('--dry') !== -1;
    if (dry) {
      await pool.query('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
      const applied = new Set((await pool.query('SELECT name FROM _migrations')).rows.map((r) => r.name));
      const pending = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort().filter((f) => !applied.has(f));
      console.log(pending.length ? 'Pending: ' + pending.join(', ') : 'Schema is up to date.');
    } else {
      const n = await runMigrations(pool);
      console.log(n ? 'Migrated ' + n + ' file(s).' : 'Schema is up to date.');
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { runMigrations, MIGRATIONS_DIR };
