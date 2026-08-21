export type RegistrationQueueItem = {
  id: string;
  endpoint: string;
  payload: unknown;
  headers?: Record<string, string>;
  createdAt: number;
};

const DB_NAME = "participant-journey-registration";
const STORE_NAME = "pending-registrations";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open offline registration storage."));
  });
}

export async function enqueueRegistration(
  endpoint: string,
  payload: unknown,
  headers?: Record<string, string>
) {
  const item: RegistrationQueueItem = {
    id: String((payload as { requestId?: string })?.requestId || crypto.randomUUID()),
    endpoint,
    payload,
    headers,
    createdAt: Date.now(),
  };

  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to save registration offline."));
  });

  db.close();
}

async function getAll(): Promise<RegistrationQueueItem[]> {
  const db = await openDb();

  const items = await new Promise<RegistrationQueueItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("Unable to read offline registrations."));
  });

  db.close();
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

async function remove(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to remove queued registration."));
  });
  db.close();
}

export function isRetryableRegistrationError(error: any) {
  if (!error?.response) return true;
  const status = Number(error.response.status || 0);
  return status === 408 || status === 429 || status >= 500;
}

export async function flushRegistrationQueue(api: {
  post: (url: string, data?: unknown, config?: { headers?: Record<string, string> }) => Promise<unknown>;
}) {
  if (!navigator.onLine) return;

  let items: RegistrationQueueItem[] = [];
  try {
    items = await getAll();
  } catch {
    return;
  }

  for (const item of items) {
    try {
      await api.post(item.endpoint, item.payload, {
        headers: item.headers,
      });
      await remove(item.id);
    } catch (error: any) {
      // A duplicate means the server already has this registration or another
      // request won the race. Remove it so the browser does not retry forever.
      if (Number(error?.response?.status) === 409) {
        await remove(item.id);
        continue;
      }

      if (!isRetryableRegistrationError(error)) {
        // Invalid queued data should not block later registrations forever.
        await remove(item.id);
        continue;
      }

      // Stop here if the network/server is still unavailable. The next online
      // event or page load will retry it.
      break;
    }
  }
}
