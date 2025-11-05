"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BrowserFileAdapter: () => BrowserFileAdapter,
  IndexedDBStorageAdapter: () => IndexedDBStorageAdapter
});
module.exports = __toCommonJS(index_exports);

// src/file/BrowserFileAdapter.ts
var getFilePickerWindow = () => window;
function fileToArrayBuffer(file) {
  return file.arrayBuffer();
}
async function pickFiles(options) {
  const pickerWindow = getFilePickerWindow();
  if (pickerWindow.showOpenFilePicker) {
    const handles = await pickerWindow.showOpenFilePicker({
      multiple: options?.multiple ?? false,
      types: options?.accept ? [
        {
          description: "Files",
          accept: {
            "application/octet-stream": options.accept
          }
        }
      ] : void 0
    });
    const files = await Promise.all(handles.map((handle) => handle.getFile()));
    return files;
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options?.multiple ?? false;
    if (options?.accept?.length) {
      input.accept = options.accept.join(",");
    }
    input.onchange = () => {
      if (!input.files) {
        resolve([]);
        return;
      }
      resolve(Array.from(input.files));
    };
    input.onerror = () => {
      reject(new Error("File selection cancelled"));
    };
    input.click();
  });
}
var BrowserFileAdapter = class {
  async openFile(options) {
    const files = await pickFiles({ ...options, multiple: false });
    const file = files[0];
    if (!file) {
      throw new Error("No file selected");
    }
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      data: await fileToArrayBuffer(file)
    };
  }
  async openMultipleFiles(options) {
    const files = await pickFiles({ ...options, multiple: true });
    return Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: await fileToArrayBuffer(file)
      }))
    );
  }
  async saveFile(data, filename, options) {
    const pickerWindow = getFilePickerWindow();
    if (pickerWindow.showSaveFilePicker) {
      const handle = await pickerWindow.showSaveFilePicker({
        suggestedName: filename,
        types: options?.filters?.map((filter) => ({
          description: filter.name,
          accept: {
            "application/octet-stream": filter.extensions.map((ext) => `.${ext}`)
          }
        }))
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    }
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
};

// src/storage/IndexedDBStorageAdapter.ts
var import_idb = require("idb");
var import_uuid = require("uuid");
var IndexedDBStorageAdapter = class {
  constructor() {
    this.dbPromise = null;
    this.dbName = "epub-reader";
  }
  async initialize(options) {
    if (options?.dbName) {
      this.dbName = options.dbName;
    }
    this.dbPromise = (0, import_idb.openDB)(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("books")) {
          db.createObjectStore("books", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
        if (!db.objectStoreNames.contains("annotations")) {
          const store = db.createObjectStore("annotations", { keyPath: "id" });
          store.createIndex("by_book", "bookId", { unique: false });
          store.createIndex("by_type", "type", { unique: false });
        }
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "bookId" });
        }
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
        if (!db.objectStoreNames.contains("sessions")) {
          const store = db.createObjectStore("sessions", { keyPath: "id" });
          store.createIndex("by_book", "bookId", { unique: false });
          store.createIndex("by_date", "startTime", { unique: false });
        }
      }
    });
    await this.dbPromise;
  }
  async db() {
    if (!this.dbPromise) {
      await this.initialize();
    }
    if (!this.dbPromise) {
      throw new Error("IndexedDB not initialized");
    }
    return this.dbPromise;
  }
  async saveBook(book, file) {
    const db = await this.db();
    const tx = db.transaction(["books", "files"], "readwrite");
    await tx.objectStore("books").put(book);
    await tx.objectStore("files").put(file, book.id);
    await tx.done;
    return book.id;
  }
  async getBook(id) {
    const db = await this.db();
    return await db.get("books", id) ?? null;
  }
  async getAllBooks() {
    const db = await this.db();
    return db.getAll("books");
  }
  async updateBook(id, updates) {
    const db = await this.db();
    const book = await db.get("books", id);
    if (!book) {
      throw new Error(`Book with id ${id} not found`);
    }
    const updated = { ...book, ...updates, id };
    await db.put("books", updated);
  }
  async deleteBook(id) {
    const db = await this.db();
    const tx = db.transaction(
      ["books", "files", "progress", "annotations", "sessions"],
      "readwrite"
    );
    await tx.objectStore("books").delete(id);
    await tx.objectStore("files").delete(id);
    await tx.objectStore("progress").delete(id);
    const annotationsStore = tx.objectStore("annotations");
    const annotationIndex = annotationsStore.index("by_book");
    const annotations = await annotationIndex.getAll(id);
    for (const annotation of annotations) {
      await annotationsStore.delete(annotation.id);
    }
    const sessionsStore = tx.objectStore("sessions");
    const sessionIndex = sessionsStore.index("by_book");
    const sessions = await sessionIndex.getAll(id);
    for (const session of sessions) {
      await sessionsStore.delete(session.id);
    }
    await tx.done;
  }
  async searchBooks(query) {
    if (!query) {
      return this.getAllBooks();
    }
    const db = await this.db();
    const lower = query.toLowerCase();
    const books = await db.getAll("books");
    return books.filter(
      (book) => [book.title, book.author, book.description].filter((value) => Boolean(value)).some((value) => value.toLowerCase().includes(lower))
    );
  }
  async saveAnnotation(annotation) {
    const db = await this.db();
    const id = annotation.id || (0, import_uuid.v4)();
    await db.put("annotations", { ...annotation, id });
    return id;
  }
  async getAnnotation(id) {
    const db = await this.db();
    return await db.get("annotations", id) ?? null;
  }
  async getAnnotations(bookId, type) {
    const db = await this.db();
    const tx = db.transaction("annotations");
    const store = tx.store;
    const records = await store.index("by_book").getAll(bookId);
    await tx.done;
    const annotations = records;
    return type ? annotations.filter((annotation) => annotation.type === type) : annotations;
  }
  async updateAnnotation(id, updates) {
    const db = await this.db();
    const existing = await db.get("annotations", id);
    if (!existing) {
      throw new Error(`Annotation with id ${id} not found`);
    }
    const updated = { ...existing, ...updates, id };
    await db.put("annotations", updated);
  }
  async deleteAnnotation(id) {
    const db = await this.db();
    await db.delete("annotations", id);
  }
  async deleteAnnotationsByBook(bookId) {
    const db = await this.db();
    const tx = db.transaction("annotations", "readwrite");
    const store = tx.store;
    const records = await store.index("by_book").getAll(bookId);
    for (const record of records) {
      await store.delete(record.id);
    }
    await tx.done;
  }
  async saveProgress(bookId, progress) {
    const db = await this.db();
    await db.put("progress", { ...progress, bookId });
  }
  async getProgress(bookId) {
    const db = await this.db();
    return await db.get("progress", bookId) ?? null;
  }
  async getAllProgress() {
    const db = await this.db();
    return db.getAll("progress");
  }
  async deleteProgress(bookId) {
    const db = await this.db();
    await db.delete("progress", bookId);
  }
  async saveCollection(collection) {
    const db = await this.db();
    const id = collection.id || (0, import_uuid.v4)();
    await db.put("collections", { ...collection, id });
    return id;
  }
  async getCollection(id) {
    const db = await this.db();
    return await db.get("collections", id) ?? null;
  }
  async getAllCollections() {
    const db = await this.db();
    return db.getAll("collections");
  }
  async updateCollection(id, updates) {
    const db = await this.db();
    const existing = await db.get("collections", id);
    if (!existing) {
      throw new Error(`Collection with id ${id} not found`);
    }
    await db.put("collections", { ...existing, ...updates, id });
  }
  async deleteCollection(id) {
    const db = await this.db();
    await db.delete("collections", id);
  }
  async saveSettings(settings) {
    const db = await this.db();
    await db.put("settings", settings, "singleton");
  }
  async getSettings() {
    const db = await this.db();
    return await db.get("settings", "singleton") ?? null;
  }
  async saveSession(session) {
    const db = await this.db();
    const id = (0, import_uuid.v4)();
    await db.put("sessions", { ...session, id });
  }
  async getSessions(bookId, dateFrom, dateTo) {
    const db = await this.db();
    const store = db.transaction("sessions").store;
    let sessions;
    if (bookId) {
      sessions = await store.index("by_book").getAll(bookId);
    } else {
      sessions = await store.getAll();
    }
    return sessions.filter((session) => {
      if (dateFrom && session.startTime < dateFrom) {
        return false;
      }
      if (dateTo && session.startTime > dateTo) {
        return false;
      }
      return true;
    }).map(({ id: _id, ...rest }) => rest);
  }
  async clearAll() {
    const db = await this.db();
    const stores = [
      "books",
      "files",
      "annotations",
      "progress",
      "collections",
      "settings",
      "sessions"
    ];
    await Promise.all(stores.map((store) => db.clear(store)));
  }
  async getStorageSize() {
    const db = await this.db();
    const books = await db.getAll("books");
    const files = await db.getAllKeys("files");
    let size = books.reduce(
      (acc, book) => acc + (book.fileSize ?? 0),
      0
    );
    const annotationsCount = await db.count("annotations");
    const sessionsCount = await db.count("sessions");
    size += annotationsCount * 1024;
    size += sessionsCount * 512;
    size += files.length * 256;
    return size;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrowserFileAdapter,
  IndexedDBStorageAdapter
});
