import { BrowserFileAdapter, IndexedDBStorageAdapter } from "@epub-reader/web-adapter";
import { BookService, ProgressService, EPUBService, SettingsService } from "@epub-reader/core";

const storageAdapter = new IndexedDBStorageAdapter();
const fileAdapter = new BrowserFileAdapter();
const bookService = new BookService(storageAdapter, fileAdapter);
const progressService = new ProgressService(storageAdapter);
const settingsService = new SettingsService(storageAdapter);

let initialized = false;

export async function initializeServices(): Promise<void> {
  if (initialized) {
    return;
  }
  await storageAdapter.initialize();
  initialized = true;
}

export function createEPUBService(): EPUBService {
  return new EPUBService();
}

export { storageAdapter, fileAdapter, bookService, progressService, settingsService };
