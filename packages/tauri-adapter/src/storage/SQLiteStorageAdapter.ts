import {
  Annotation,
  AnnotationType,
  Book,
  Collection,
  IStorageAdapter,
  ReadingProgress,
  ReadingSession,
  Settings,
  StorageInitializationOptions,
} from "@epub-reader/core";
import { invoke } from "@tauri-apps/api/tauri";

export class SQLiteStorageAdapter implements IStorageAdapter {
  async initialize(_options?: StorageInitializationOptions): Promise<void> {
    await invoke("storage_initialize");
  }

  async saveBook(book: Book, file: ArrayBuffer): Promise<string> {
    await invoke("storage_save_book", {
      book,
      file: Array.from(new Uint8Array(file)),
    });
    return book.id;
  }

  async getBook(id: string): Promise<Book | null> {
    return (await invoke<Book | null>("storage_get_book", { id })) ?? null;
  }

  async getAllBooks(): Promise<Book[]> {
    return invoke<Book[]>("storage_get_all_books");
  }

  async getBookFile(_id: string): Promise<ArrayBuffer | null> {
    throw new Error("getBookFile is not supported in the Tauri adapter yet");
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    await invoke("storage_update_book", { id, updates });
  }

  async deleteBook(id: string): Promise<void> {
    await invoke("storage_delete_book", { id });
  }

  async searchBooks(query: string): Promise<Book[]> {
    return invoke<Book[]>("storage_search_books", { query });
  }

  async saveAnnotation(annotation: Annotation): Promise<string> {
    await invoke("storage_save_annotation", { annotation });
    return annotation.id;
  }

  async getAnnotation(id: string): Promise<Annotation | null> {
    return (await invoke<Annotation | null>("storage_get_annotation", { id })) ?? null;
  }

  async getAnnotations(bookId: string, type?: AnnotationType): Promise<Annotation[]> {
    return invoke<Annotation[]>("storage_get_annotations", { bookId, type });
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<void> {
    await invoke("storage_update_annotation", { id, updates });
  }

  async deleteAnnotation(id: string): Promise<void> {
    await invoke("storage_delete_annotation", { id });
  }

  async deleteAnnotationsByBook(bookId: string): Promise<void> {
    await invoke("storage_delete_annotations_by_book", { bookId });
  }

  async saveProgress(bookId: string, progress: ReadingProgress): Promise<void> {
    await invoke("storage_save_progress", { bookId, progress });
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    return (await invoke<ReadingProgress | null>("storage_get_progress", { bookId })) ?? null;
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    return invoke<ReadingProgress[]>("storage_get_all_progress");
  }

  async deleteProgress(bookId: string): Promise<void> {
    await invoke("storage_delete_progress", { bookId });
  }

  async saveCollection(collection: Collection): Promise<string> {
    await invoke("storage_save_collection", { collection });
    return collection.id;
  }

  async getCollection(id: string): Promise<Collection | null> {
    return (await invoke<Collection | null>("storage_get_collection", { id })) ?? null;
  }

  async getAllCollections(): Promise<Collection[]> {
    return invoke<Collection[]>("storage_get_all_collections");
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<void> {
    await invoke("storage_update_collection", { id, updates });
  }

  async deleteCollection(id: string): Promise<void> {
    await invoke("storage_delete_collection", { id });
  }

  async saveSettings(settings: Settings): Promise<void> {
    await invoke("storage_save_settings", { settings });
  }

  async getSettings(): Promise<Settings | null> {
    return (await invoke<Settings | null>("storage_get_settings")) ?? null;
  }

  async saveSession(session: ReadingSession): Promise<void> {
    await invoke("storage_save_session", { session });
  }

  async getSessions(bookId?: string, dateFrom?: Date, dateTo?: Date): Promise<ReadingSession[]> {
    return invoke<ReadingSession[]>("storage_get_sessions", {
      bookId,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
    });
  }

  async clearAll(): Promise<void> {
    await invoke("storage_clear_all");
  }

  async getStorageSize(): Promise<number> {
    return invoke<number>("storage_get_storage_size");
  }
}
