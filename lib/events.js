/* NABD — activity + notification write helpers. */

const { randomToken, nowIso } = require('./store');
const storeApi = require('./store');

async function logActivity(userId, type, metadata) {
  try {
    const store = storeApi.makeStore();
    await store.insertActivity({
      id: randomToken(16),
      userId,
      type,
      metadata: metadata || {},
      createdAt: nowIso()
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[nabd-activity]', e.message);
  }
}

async function createNotification(userId, type, title, message) {
  try {
    const store = storeApi.makeStore();
    return await store.insertNotification({
      id: randomToken(16),
      userId,
      type: String(type || 'system').toLowerCase(),
      title: String(title || ''),
      message: message != null ? String(message) : null,
      read: false,
      createdAt: nowIso()
    });
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[nabd-notify]', e.message);
    return null;
  }
}

module.exports = { logActivity, createNotification };
