// FAMILY 26 — save architecture
// Keeps career state separate from its serialized representation and from the
// persistence transport. The transport can be swapped for a cloud API later.

export const SAVE_SCHEMA = 'family26-career-v3';
export const SAVE_DB_NAME = 'family26-saves';
export const SAVE_DB_VERSION = 1;
export const SAVE_STORE = 'career';

export function serializeCareerState(state = {}) {
  return JSON.stringify({
    schemaVersion: SAVE_SCHEMA,
    savedAt: state.savedAt || new Date().toISOString(),
    career: state.career || {},
    world: state.world || {},
  });
}

export function deserializeCareerState(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.schemaVersion) return null;
    return parsed;
  } catch { return null; }
}

export function buildSaveEnvelope({ career = {}, world = {}, database = {} } = {}) {
  const envelope = {
    schemaVersion: SAVE_SCHEMA,
    savedAt: new Date().toISOString(),
    database: {
      source: database.source || 'family26-canonical-men-db-v2',
      version: database.version || null,
      careerSeed: database.careerSeed || null,
    },
    career,
    world,
  };
  envelope.payload = serializeCareerState(envelope);
  return envelope;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(SAVE_DB_NAME, SAVE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVE_STORE)) db.createObjectStore(SAVE_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export async function writeLocalSave(key, envelope) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, 'readwrite');
    tx.objectStore(SAVE_STORE).put({ key, envelope, updatedAt: envelope.savedAt });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Local save failed'));
  });
  db.close();
  return true;
}

export async function readLocalSave(key) {
  const db = await openDb();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, 'readonly');
    const req = tx.objectStore(SAVE_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.envelope || null);
    req.onerror = () => reject(req.error || new Error('Local load failed'));
  });
  db.close();
  return value;
}

export async function deleteLocalSave(key) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(SAVE_STORE, 'readwrite');
    tx.objectStore(SAVE_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Local delete failed'));
  });
  db.close();
  return true;
}

export function cloudReadyPayload(envelope) {
  return {
    schemaVersion: envelope.schemaVersion,
    savedAt: envelope.savedAt,
    database: envelope.database,
    payload: envelope.payload,
  };
}
