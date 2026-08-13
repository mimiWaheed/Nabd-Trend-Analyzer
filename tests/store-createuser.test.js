/* NABD — PostgreSQL store regression: createUser() must persist email_verified.
   Regression: the INSERT previously omitted the column, so every user created
   by the deferred-signup verify path was stored with email_verified = FALSE
   (DB default), which then broke requireAuth() / login. The in-memory store
   never exposed this, so this test drives the real Postgres store code path
   against a recording fake `pg` Pool (no live DB / infra required) and proves
   the INSERT column list and bound parameter behave correctly. */

process.env.NABD_DATA = 'postgres';
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost/fake?sslmode=require';

/* stub pg BEFORE lib/store is loaded */
const queries = [];
const FakePool = class {
  constructor(cfg) { this.cfg = cfg; }
  on() {}
  query(text, params) {
    queries.push({ text, params: params || [] });
    if (/INSERT INTO users/i.test(text)) {
      const p = params || [];
      return Promise.resolve({ rows: [{
        id: p[0], firstName: p[1], lastName: p[2], email: p[3],
        passwordHash: p[4], emailVerified: p[5], phone: p[6],
        organization: p[7], country: p[8], lang: p[9]
      }] });
    }
    return Promise.resolve({ rows: [] });
  }
  connect() {
    return Promise.resolve({ query: () => Promise.resolve({ rows: [] }), release() {} });
  }
  end() { return Promise.resolve(); }
};
const pgPath = require.resolve('pg');
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: { Pool: FakePool } };

const storeApi = require('../lib/store');
storeApi.resetStore();
const store = storeApi.makeStore();

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

function findInsert() {
  return queries.filter((q) => /INSERT INTO users/i.test(q.text)).slice(-1)[0];
}

(async () => {
  const base = {
    id: 'u_test_0001', firstName: 'Legacy', lastName: 'Probe',
    email: 'legacy@example.com', passwordHash: 'hash'
  };

  /* 1) emailVerified:true → INSERT includes the column and binds TRUE */
  await store.createUser(Object.assign({}, base, { id: 'u_true_0001', email: 'v1@example.com', emailVerified: true }));
  const q1 = findInsert();
  assert(/\bemail_verified\b/.test(q1.text), 'INSERT column list includes email_verified');
  assert(q1.params.length === 10, 'INSERT binds 10 parameters');
  assert(q1.params[5] === true, 'emailVerified=true binds TRUE as $6');

  const r1 = await store.createUser(Object.assign({}, base, { id: 'u_true_0002', email: 'v2@example.com', emailVerified: true }));
  assert(r1.emailVerified === true, 'createUser(emailVerified:true) returns emailVerified=true');

  /* 2) emailVerified:false → persists FALSE */
  const r2 = await store.createUser(Object.assign({}, base, { id: 'u_false_001', email: 'f@example.com', emailVerified: false }));
  const q2 = queries.filter((q) => /INSERT INTO users/i.test(q.text)).slice(-1)[0];
  assert(q2.params[5] === false, 'emailVerified=false binds FALSE as $6');
  assert(r2.emailVerified === false, 'createUser(emailVerified:false) returns emailVerified=false');

  /* 3) omitted/null (legacy signup) → defaults to FALSE */
  const r3 = await store.createUser(Object.assign({}, base, { id: 'u_omitted_1', email: 'o@example.com' }));
  const q3 = queries.filter((q) => /INSERT INTO users/i.test(q.text)).slice(-1)[0];
  assert(q3.params[5] === false, 'omitted emailVerified binds FALSE as $6');
  assert(r3.emailVerified === false, 'createUser(no emailVerified) returns emailVerified=false');

  console.log('\nSTORE createUser email_verified regression: ALL CHECKS DONE');
})().catch((e) => { console.error('FAIL: unhandled', e.message); process.exitCode = 1; });
