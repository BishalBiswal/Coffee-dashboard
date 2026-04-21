import { useEffect, useCallback } from 'react';
import { offlineDB } from '../lib/offlineDB';
import { syncAPI } from '../lib/api';
import toast from 'react-hot-toast';

export function useOfflineSync() {
  const isOnline = navigator.onLine;

  const syncPendingEntries = useCallback(async () => {
    if (!isOnline) return;

    try {
      const pending = await offlineDB.getPendingSync();
      if (pending.length === 0) return;

      const response = await syncAPI.sync(pending.map(entry => ({
        ...entry,
        created_at: new Date(entry.created_at).getTime(),
      })));

      const { success, conflicts, errors } = response.data;

      for (const item of success) {
        await offlineDB.removeFromSyncQueue(item.client_sync_id);
        const log = await offlineDB.getWorkLogById(item.client_sync_id);
        if (log) {
          await offlineDB.saveWorkLog({ ...log, status: 'synced', synced_at: new Date().toISOString() });
        }
      }

      if (success.length > 0) {
        toast.success(`Synced ${success.length} entries`);
      }

      if (conflicts.length > 0) {
        toast.error(`${conflicts.length} conflicts detected`);
      }

      if (errors.length > 0) {
        console.error('Sync errors:', errors);
        toast.error(`${errors.length} entries failed to sync`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [isOnline]);

  const saveOffline = useCallback(async (workLog) => {
    const entry = {
      ...workLog,
      client_sync_id: workLog.client_sync_id || crypto.randomUUID(),
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    await offlineDB.saveWorkLog(entry);
    await offlineDB.addToSyncQueue(entry);

    if (isOnline) {
      await syncPendingEntries();
    }

    return entry.client_sync_id;
  }, [isOnline, syncPendingEntries]);

  useEffect(() => {
    if (isOnline) {
      syncPendingEntries();
    }
  }, [isOnline, syncPendingEntries]);

  useEffect(() => {
    const handleOnline = () => {
      toast.success('Back online! Syncing...');
      syncPendingEntries();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingEntries]);

  return {
    isOnline,
    syncPendingEntries,
    saveOffline,
  };
}
