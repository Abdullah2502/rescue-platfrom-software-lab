"use client";

import { api } from "./api";

const DB_NAME = "nexora-offline";
const STORE_NAME = "mutations";
const QUEUE_EVENT = "nexora-offline-queue-changed";

export interface QueuedMutation {
  id: string;
  path: string;
  method: string;
  body?: string;
  label: string;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

function announceQueueChange() {
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

export async function queueMutation(mutation: Omit<QueuedMutation, "id" | "createdAt">): Promise<void> {
  await storeRequest("readwrite", (store) => store.put({
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));
  announceQueueChange();
}

export async function queuedMutations(): Promise<QueuedMutation[]> {
  return storeRequest("readonly", (store) => store.getAll());
}

async function removeMutation(id: string): Promise<void> {
  await storeRequest("readwrite", (store) => store.delete(id));
}

export async function submitWithOffline<T>(
  path: string,
  init: RequestInit,
  label: string,
): Promise<{ data?: T; queued: boolean }> {
  if (!navigator.onLine) {
    await queueMutation({ path, method: init.method ?? "POST", body: init.body?.toString(), label });
    return { queued: true };
  }
  try {
    return { data: await api<T>(path, init), queued: false };
  } catch (error) {
    if (!(error instanceof TypeError) && navigator.onLine) throw error;
    await queueMutation({ path, method: init.method ?? "POST", body: init.body?.toString(), label });
    return { queued: true };
  }
}

export async function flushOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  if (!navigator.onLine) return { synced: 0, remaining: (await queuedMutations()).length };
  const pending = await queuedMutations();
  let synced = 0;
  for (const mutation of pending) {
    try {
      await api(mutation.path, { method: mutation.method, body: mutation.body });
      await removeMutation(mutation.id);
      synced += 1;
    } catch {
      break;
    }
  }
  announceQueueChange();
  return { synced, remaining: (await queuedMutations()).length };
}

export const offlineQueueEvent = QUEUE_EVENT;
