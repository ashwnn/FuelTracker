/**
 * Offline support utilities for FuelTracker
 * Enables users to queue entries while offline and sync when back online
 */

/**
 * Initialize offline support with IndexedDB
 */
export async function initOfflineSupport(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FuelTrackerOffline', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for queued entries
      if (!db.objectStoreNames.contains('queuedEntries')) {
        const store = db.createObjectStore('queuedEntries', { keyPath: 'id', autoIncrement: true });
        store.createIndex('vehicleId', 'vehicleId');
        store.createIndex('timestamp', 'timestamp');
      }

      // Store for draft entries
      if (!db.objectStoreNames.contains('draftEntries')) {
        db.createObjectStore('draftEntries', { keyPath: 'vehicleId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Queue an entry to be synced when online
 */
export async function queueEntry(vehicleId: number, entryData: any): Promise<void> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['queuedEntries'], 'readwrite');
  const store = transaction.objectStore('queuedEntries');

  store.add({
    vehicleId,
    data: entryData,
    timestamp: Date.now(),
    synced: false,
  });

  // Trigger background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    (registration as any).sync.register('sync-entries').catch(() => {
      // Sync registration not supported, data will be synced on next app load
    });
  }
}

/**
 * Save draft entry for a vehicle
 */
export async function saveDraftEntry(vehicleId: number, entryData: any): Promise<void> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['draftEntries'], 'readwrite');
  const store = transaction.objectStore('draftEntries');

  store.put({
    vehicleId,
    data: entryData,
    timestamp: Date.now(),
  });
}

/**
 * Get draft entry for a vehicle
 */
export async function getDraftEntry(vehicleId: number): Promise<any | null> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['draftEntries'], 'readonly');
  const store = transaction.objectStore('draftEntries');

  return new Promise((resolve) => {
    const request = store.get(vehicleId);
    request.onsuccess = () => resolve(request.result?.data || null);
  });
}

/**
 * Clear draft entry for a vehicle
 */
export async function clearDraftEntry(vehicleId: number): Promise<void> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['draftEntries'], 'readwrite');
  const store = transaction.objectStore('draftEntries');

  store.delete(vehicleId);
}

/**
 * Get all queued entries
 */
export async function getQueuedEntries(): Promise<any[]> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['queuedEntries'], 'readonly');
  const store = transaction.objectStore('queuedEntries');

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Remove queued entry after successful sync
 */
export async function removeQueuedEntry(id: number): Promise<void> {
  const db = await initOfflineSupport();
  const transaction = db.transaction(['queuedEntries'], 'readwrite');
  const store = transaction.objectStore('queuedEntries');

  store.delete(id);
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Sync queued entries when back online
 */
export async function syncQueuedEntries(token: string, apiBase: string): Promise<{ synced: number; failed: number }> {
  const entries = await getQueuedEntries();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const response = await fetch(
        `${apiBase}/api/vehicles/${entry.vehicleId}/entries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(entry.data),
        }
      );

      if (response.ok) {
        await removeQueuedEntry(entry.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { synced, failed };
}
