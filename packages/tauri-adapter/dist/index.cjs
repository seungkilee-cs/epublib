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
  SQLiteStorageAdapter: () => SQLiteStorageAdapter,
  TauriFileAdapter: () => TauriFileAdapter
});
module.exports = __toCommonJS(index_exports);

// src/storage/SQLiteStorageAdapter.ts
var import_tauri = require("@tauri-apps/api/tauri");
var SQLiteStorageAdapter = class {
  async initialize(_options) {
    await (0, import_tauri.invoke)("storage_initialize");
  }
  async saveBook(book, file) {
    await (0, import_tauri.invoke)("storage_save_book", {
      book,
      file: Array.from(new Uint8Array(file))
    });
    return book.id;
  }
  async getBook(id) {
    return await (0, import_tauri.invoke)("storage_get_book", { id }) ?? null;
  }
  async getAllBooks() {
    return (0, import_tauri.invoke)("storage_get_all_books");
  }
  async updateBook(id, updates) {
    await (0, import_tauri.invoke)("storage_update_book", { id, updates });
  }
  async deleteBook(id) {
    await (0, import_tauri.invoke)("storage_delete_book", { id });
  }
  async searchBooks(query) {
    return (0, import_tauri.invoke)("storage_search_books", { query });
  }
  async saveAnnotation(annotation) {
    await (0, import_tauri.invoke)("storage_save_annotation", { annotation });
    return annotation.id;
  }
  async getAnnotation(id) {
    return await (0, import_tauri.invoke)("storage_get_annotation", { id }) ?? null;
  }
  async getAnnotations(bookId, type) {
    return (0, import_tauri.invoke)("storage_get_annotations", { bookId, type });
  }
  async updateAnnotation(id, updates) {
    await (0, import_tauri.invoke)("storage_update_annotation", { id, updates });
  }
  async deleteAnnotation(id) {
    await (0, import_tauri.invoke)("storage_delete_annotation", { id });
  }
  async deleteAnnotationsByBook(bookId) {
    await (0, import_tauri.invoke)("storage_delete_annotations_by_book", { bookId });
  }
  async saveProgress(bookId, progress) {
    await (0, import_tauri.invoke)("storage_save_progress", { bookId, progress });
  }
  async getProgress(bookId) {
    return await (0, import_tauri.invoke)("storage_get_progress", { bookId }) ?? null;
  }
  async getAllProgress() {
    return (0, import_tauri.invoke)("storage_get_all_progress");
  }
  async deleteProgress(bookId) {
    await (0, import_tauri.invoke)("storage_delete_progress", { bookId });
  }
  async saveCollection(collection) {
    await (0, import_tauri.invoke)("storage_save_collection", { collection });
    return collection.id;
  }
  async getCollection(id) {
    return await (0, import_tauri.invoke)("storage_get_collection", { id }) ?? null;
  }
  async getAllCollections() {
    return (0, import_tauri.invoke)("storage_get_all_collections");
  }
  async updateCollection(id, updates) {
    await (0, import_tauri.invoke)("storage_update_collection", { id, updates });
  }
  async deleteCollection(id) {
    await (0, import_tauri.invoke)("storage_delete_collection", { id });
  }
  async saveSettings(settings) {
    await (0, import_tauri.invoke)("storage_save_settings", { settings });
  }
  async getSettings() {
    return await (0, import_tauri.invoke)("storage_get_settings") ?? null;
  }
  async saveSession(session) {
    await (0, import_tauri.invoke)("storage_save_session", { session });
  }
  async getSessions(bookId, dateFrom, dateTo) {
    return (0, import_tauri.invoke)("storage_get_sessions", {
      bookId,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString()
    });
  }
  async clearAll() {
    await (0, import_tauri.invoke)("storage_clear_all");
  }
  async getStorageSize() {
    return (0, import_tauri.invoke)("storage_get_storage_size");
  }
};

// src/file/TauriFileAdapter.ts
var import_dialog = require("@tauri-apps/api/dialog");
var import_fs = require("@tauri-apps/api/fs");
var import_path = require("@tauri-apps/api/path");
function toArrayBuffer(data) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}
function mapOpenFilters(options) {
  if (!options?.accept?.length) {
    return void 0;
  }
  return options.accept.map((entry) => ({
    name: entry,
    extensions: [entry.replace(/^\./, "")]
  }));
}
function mapSaveFilters(options) {
  return options?.filters?.map((filter) => ({
    name: filter.name,
    extensions: filter.extensions
  }));
}
var TauriFileAdapter = class {
  async openFile(options) {
    const selected = await (0, import_dialog.open)({
      multiple: false,
      filters: mapOpenFilters(options)
    });
    if (!selected) {
      throw new Error("File selection cancelled");
    }
    const filePath = Array.isArray(selected) ? selected[0] : selected;
    const content = await (0, import_fs.readBinaryFile)(filePath);
    return {
      name: await (0, import_path.basename)(filePath),
      data: toArrayBuffer(content),
      size: content.byteLength,
      type: "application/octet-stream"
    };
  }
  async openMultipleFiles(options) {
    const selected = await (0, import_dialog.open)({
      multiple: true,
      filters: mapOpenFilters(options)
    });
    const paths = Array.isArray(selected) ? selected : selected ? [selected] : [];
    const files = await Promise.all(
      paths.map(async (filePath) => {
        const content = await (0, import_fs.readBinaryFile)(filePath);
        return {
          name: await (0, import_path.basename)(filePath),
          data: toArrayBuffer(content),
          size: content.byteLength,
          type: "application/octet-stream"
        };
      })
    );
    return files;
  }
  async saveFile(data, filename, options) {
    const targetPath = await (0, import_dialog.save)({
      defaultPath: options?.defaultPath ?? filename,
      filters: mapSaveFilters(options)
    });
    if (!targetPath) {
      return;
    }
    const buffer = await data.arrayBuffer();
    await (0, import_fs.writeBinaryFile)({ path: targetPath, contents: new Uint8Array(buffer) });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SQLiteStorageAdapter,
  TauriFileAdapter
});
