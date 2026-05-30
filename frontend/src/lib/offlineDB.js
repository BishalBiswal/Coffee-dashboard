import { openDB } from 'idb';

const DB_NAME = 'field-management';
const DB_VERSION = 1;

let dbPromise = null;

export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workLogs')) {
          const store = db.createObjectStore('workLogs', { keyPath: 'client_sync_id' });
          store.createIndex('status', 'status');
          store.createIndex('log_date', 'log_date');
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'client_sync_id' });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineDB = {
  async saveWorkLog(log) {
    const db = await initDB();
    return db.put('workLogs', log);
  },

  async getWorkLogs() {
    const db = await initDB();
    return db.getAll('workLogs');
  },

  async getWorkLogById(id) {
    const db = await initDB();
    return db.get('workLogs', id);
  },

  async deleteWorkLog(id) {
    const db = await initDB();
    return db.delete('workLogs', id);
  },

  async getPendingSync() {
    const db = await initDB();
    return db.getAll('syncQueue');
  },

  async addToSyncQueue(entry) {
    const db = await initDB();
    return db.put('syncQueue', entry);
  },

  async removeFromSyncQueue(id) {
    const db = await initDB();
    return db.delete('syncQueue', id);
  },

  async clearSyncQueue() {
    const db = await initDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.store.clear();
    return tx.done;
  },

  async getAllFromStore(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },
};
