import { openDB, IDBPDatabase, DBSchema } from "idb";
import type { IDBPObjectStore, IDBPTransaction, StoreNames } from "idb";
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
import { v4 as uuid } from "uuid";

interface ReaderDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: {
      by_title: string;
      by_author: string;
      by_dateAdded: string;
      by_lastOpened: string;
      by_status: string;
    };
  };
  files: {
    key: string;
    value: ArrayBuffer;
  };
  annotations: {
    key: string;
    value: Annotation & { bookId: string };
    indexes: { by_book: string; by_type: string };
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
  collections: {
    key: string;
    value: Collection;
    indexes: {
      by_name: string;
    };
  };
  settings: {
    key: string;
    value: Settings;
  };
  sessions: {
    key: string;
    value: ReadingSession & { id: string };
    indexes: { by_book: string; by_date: string };
  };
}

type IndexedStores = "books" | "collections";

const DEFAULT_DB_NAME = "epub-reader";
const CURRENT_DB_VERSION = 2;

export class IndexedDBStorageAdapter implements IStorageAdapter {
  private dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

  private dbName = DEFAULT_DB_NAME;

  private dbVersion = CURRENT_DB_VERSION;

  async initialize(options?: StorageInitializationOptions): Promise<void> {
    if (options?.dbName) {
      this.dbName = options.dbName;
    }

    this.dbVersion = options?.dbVersion ?? CURRENT_DB_VERSION;

    this.dbPromise = openDB<ReaderDB>(this.dbName, this.dbVersion, {
      upgrade: (
        db: IDBPDatabase<ReaderDB>,
        oldVersion: number,
        _newVersion: number | null,
        transaction: IDBPTransaction<ReaderDB, StoreNames<ReaderDB>[], "versionchange">
      ) => {
        if (oldVersion < 1) {
          this.createInitialSchema(db);
        }

        if (oldVersion < 2) {
          this.upgradeToVersion2(transaction);
        }
      },
    });

    await this.dbPromise;
  }

  private async db(): Promise<IDBPDatabase<ReaderDB>> {
    if (!this.dbPromise) {
      await this.initialize();
    }

    if (!this.dbPromise) {
      throw new Error("IndexedDB not initialized");
    }

    return this.dbPromise;
  }

  async saveBook(book: Book, file: ArrayBuffer): Promise<string> {
    const db = await this.db();
    const tx = db.transaction(["books", "files"], "readwrite");

    await tx.objectStore("books").put(book);
    await tx.objectStore("files").put(file, book.id);

    await tx.done;
    return book.id;
  }

  async getBook(id: string): Promise<Book | null> {
    const db = await this.db();
    return (await db.get("books", id)) ?? null;
  }

  async getAllBooks(): Promise<Book[]> {
    const db = await this.db();
    return db.getAll("books");
  }

  async getBookFile(id: string): Promise<ArrayBuffer | null> {
    const db = await this.db();
    const file = await db.get("files", id);
    return file ?? null;
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    const db = await this.db();
    const book = await db.get("books", id);

    if (!book) {
      throw new Error(`Book with id ${id} not found`);
    }

    const updated = { ...book, ...updates, id };
    await db.put("books", updated);
  }

  async deleteBook(id: string): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(
      ["books", "files", "progress", "annotations", "sessions"],
      "readwrite"
    );

    await tx.objectStore("books").delete(id);
    await tx.objectStore("files").delete(id);
    await tx.objectStore("progress").delete(id);

    // Delete annotations for book
    const annotationsStore = tx.objectStore("annotations");
    const annotationIndex = annotationsStore.index("by_book");
    const annotations = await annotationIndex.getAll(id);
    for (const annotation of annotations) {
      await annotationsStore.delete(annotation.id);
    }

    // Delete sessions for book
    const sessionsStore = tx.objectStore("sessions");
    const sessionIndex = sessionsStore.index("by_book");
    const sessions = await sessionIndex.getAll(id);
    for (const session of sessions) {
      await sessionsStore.delete(session.id);
    }

    await tx.done;
  }

  async searchBooks(query: string): Promise<Book[]> {
    if (!query) {
      return this.getAllBooks();
    }

    const db = await this.db();
    const lower = query.toLowerCase();
    const books = await db.getAll("books");
    return books.filter((book: Book) =>
      [book.title, book.author, book.description]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(lower))
    );
  }

  async saveAnnotation(annotation: Annotation): Promise<string> {
    const db = await this.db();
    const id = annotation.id || uuid();
    await db.put("annotations", { ...annotation, id });
    return id;
  }

  async getAnnotation(id: string): Promise<Annotation | null> {
    const db = await this.db();
    return (await db.get("annotations", id)) ?? null;
  }

  async getAnnotations(
    bookId: string,
    type?: AnnotationType
  ): Promise<Annotation[]> {
    const db = await this.db();
    const tx = db.transaction("annotations");
    const store = tx.store;
    const records = await store.index("by_book").getAll(bookId);
    await tx.done;

    const annotations = records as Annotation[];
    return type ? annotations.filter((annotation) => annotation.type === type) : annotations;
  }

  async updateAnnotation(
    id: string,
    updates: Partial<Annotation>
  ): Promise<void> {
    const db = await this.db();
    const existing = await db.get("annotations", id);
    if (!existing) {
      throw new Error(`Annotation with id ${id} not found`);
    }
    const updated = { ...existing, ...updates, id } as Annotation & { bookId: string };
    await db.put("annotations", updated);
  }

  async deleteAnnotation(id: string): Promise<void> {
    const db = await this.db();
    await db.delete("annotations", id);
  }

  async deleteAnnotationsByBook(bookId: string): Promise<void> {
    const db = await this.db();
    const tx = db.transaction("annotations", "readwrite");
    const store = tx.store;
    const records = await store.index("by_book").getAll(bookId);
    for (const record of records) {
      await store.delete(record.id);
    }
    await tx.done;
  }

  async saveProgress(
    bookId: string,
    progress: ReadingProgress
  ): Promise<void> {
    const db = await this.db();
    await db.put("progress", { ...progress, bookId });
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    const db = await this.db();
    return (await db.get("progress", bookId)) ?? null;
  }

  async getAllProgress(): Promise<ReadingProgress[]> {
    const db = await this.db();
    return db.getAll("progress");
  }

  async deleteProgress(bookId: string): Promise<void> {
    const db = await this.db();
    await db.delete("progress", bookId);
  }

  async saveCollection(collection: Collection): Promise<string> {
    const db = await this.db();
    const id = collection.id || uuid();
    await db.put("collections", { ...collection, id });
    return id;
  }

  async getCollection(id: string): Promise<Collection | null> {
    const db = await this.db();
    return (await db.get("collections", id)) ?? null;
  }

  async getAllCollections(): Promise<Collection[]> {
    const db = await this.db();
    return db.getAll("collections");
  }

  async updateCollection(
    id: string,
    updates: Partial<Collection>
  ): Promise<void> {
    const db = await this.db();
    const existing = await db.get("collections", id);
    if (!existing) {
      throw new Error(`Collection with id ${id} not found`);
    }
    await db.put("collections", { ...existing, ...updates, id });
  }

  async deleteCollection(id: string): Promise<void> {
    const db = await this.db();
    await db.delete("collections", id);
  }

  async saveSettings(settings: Settings): Promise<void> {
    const db = await this.db();
    await db.put("settings", settings, "singleton");
  }

  async getSettings(): Promise<Settings | null> {
    const db = await this.db();
    return (await db.get("settings", "singleton")) ?? null;
  }

  async saveSession(session: ReadingSession): Promise<void> {
    const db = await this.db();
    const id = uuid();
    await db.put("sessions", { ...session, id });
  }

  async getSessions(
    bookId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ReadingSession[]> {
    const db = await this.db();
    const store = db.transaction("sessions").store;

    let sessions: (ReadingSession & { id: string })[];

    if (bookId) {
      sessions = await store.index("by_book").getAll(bookId);
    } else {
      sessions = await store.getAll();
    }

    return sessions
      .filter((session) => {
        if (dateFrom && session.startTime < dateFrom) {
          return false;
        }
        if (dateTo && session.startTime > dateTo) {
          return false;
        }
        return true;
      })
      .map(({ id: _id, ...rest }) => rest);
  }

  async clearAll(): Promise<void> {
    const db = await this.db();
    const stores = [
      "books",
      "files",
      "annotations",
      "progress",
      "collections",
      "settings",
      "sessions",
    ] as const;

    await Promise.all(stores.map((store) => db.clear(store)));
  }

  async getStorageSize(): Promise<number> {
    const db = await this.db();
    const books = await db.getAll("books");
    const files = await db.getAllKeys("files");

    let size = books.reduce<number>(
      (acc: number, book: Book) => acc + (book.fileSize ?? 0),
      0
    );

    // Estimate additional storage (annotations, progress, etc.)
    const annotationsCount = await db.count("annotations");
    const sessionsCount = await db.count("sessions");

    size += annotationsCount * 1024; // rough estimate
    size += sessionsCount * 512;
    size += files.length * 256; // metadata

    return size;
  }

  private createInitialSchema(db: IDBPDatabase<ReaderDB>): void {
    const booksStore = db.createObjectStore("books", { keyPath: "id" });
    this.addBookIndexes(booksStore);

    db.createObjectStore("files");

    const annotationsStore = db.createObjectStore("annotations", { keyPath: "id" });
    annotationsStore.createIndex("by_book", "bookId", { unique: false });
    annotationsStore.createIndex("by_type", "type", { unique: false });

    db.createObjectStore("progress", { keyPath: "bookId" });

    const collectionsStore = db.createObjectStore("collections", { keyPath: "id" });
    this.addCollectionIndexes(collectionsStore);

    db.createObjectStore("settings");

    const sessionsStore = db.createObjectStore("sessions", { keyPath: "id" });
    sessionsStore.createIndex("by_book", "bookId", { unique: false });
    sessionsStore.createIndex("by_date", "startTime", { unique: false });
  }

  private upgradeToVersion2(
    transaction: IDBPTransaction<ReaderDB, StoreNames<ReaderDB>[], "versionchange">
  ): void {
    const booksStore = transaction.objectStore("books");
    this.addBookIndexes(booksStore);

    const collectionsStore = transaction.objectStore("collections");
    this.addCollectionIndexes(collectionsStore);
  }

  private addBookIndexes(
    store: IDBPObjectStore<ReaderDB, StoreNames<ReaderDB>[], "books", "versionchange">
  ): void {
    this.ensureIndex(store, "by_title", "title");
    this.ensureIndex(store, "by_author", "author");
    this.ensureIndex(store, "by_dateAdded", "dateAdded");
    this.ensureIndex(store, "by_lastOpened", "lastOpened");
    this.ensureIndex(store, "by_status", "status");
  }

  private addCollectionIndexes(
    store: IDBPObjectStore<ReaderDB, StoreNames<ReaderDB>[], "collections", "versionchange">
  ): void {
    this.ensureIndex(store, "by_name", "name");
  }

  private ensureIndex<
    StoreName extends IndexedStores,
    IndexName extends keyof ReaderDB[StoreName]["indexes"] & string
  >(
    store: IDBPObjectStore<ReaderDB, StoreNames<ReaderDB>[], StoreName, "versionchange">,
    name: IndexName,
    keyPath: string | string[],
    options?: IDBIndexParameters
  ): void {
    const indexNames = store.indexNames as unknown as DOMStringList;
    if (!indexNames.contains(name as string)) {
      store.createIndex(name, keyPath, options);
    }
  }
}
