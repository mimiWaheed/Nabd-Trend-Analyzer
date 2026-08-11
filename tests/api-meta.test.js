const { pickPageId } = require('../api/meta/callback.js');

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else { console.log('PASS: ' + msg); }
};

const PAGES = [
  { id: '1067807099757776', name: 'Addme' },
  { id: '1039440522593592', name: 'Amr Moustafa Dental Clinic' },
  { id: '673076192564607', name: 'Curexsa' }
];

assert(pickPageId(PAGES, '1067807099757776') === '1067807099757776', 'META_DEFAULT_PAGE_ID picks the matching page');
assert(pickPageId(PAGES, '673076192564607') === '673076192564607', 'default can pick a non-first page');
assert(pickPageId(PAGES, '') === '1067807099757776', 'empty default falls back to the first page');
assert(pickPageId(PAGES, null) === '1067807099757776', 'null default falls back to the first page');
assert(pickPageId(PAGES, '999999999999999') === '1067807099757776', 'unknown default id falls back to the first page');
assert(pickPageId([], '1067807099757776') === '', 'empty page list returns empty id');
assert(pickPageId(null, '1067807099757776') === '', 'null page list returns empty id');

if (!process.exitCode) console.log('ALL TESTS PASSED');
