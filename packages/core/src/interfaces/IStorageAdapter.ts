import { Annotation } from "../models/Annotation";
import { AnnotationType } from "../models/AnnotationType";
import { Book } from "../models/Book";
import { Collection } from "../models/Collection";
import { ReadingProgress } from "../models/ReadingProgress";
import { ReadingSession } from "../models/ReadingSession";
import { Settings } from "../models/Settings";

export interface StorageInitializationOptions {
  dbName?: string;
  dbVersion?: number;
}

export interface IStorageAdapter {
  initialize(options?: StorageInitializationOptions): Promise<void>;

  saveBook(book: Book, file: ArrayBuffer): Promise<string>;
  getBook(id: string): Promise<Book | null>;
  getAllBooks(): Promise<Book[]>;
  getBookFile(id: string): Promise<ArrayBuffer | null>;
  updateBook(id: string, updates: Partial<Book>): Promise<void>;
  deleteBook(id: string): Promise<void>;
  searchBooks(query: string): Promise<Book[]>;

  saveAnnotation(annotation: Annotation): Promise<string>;
  getAnnotation(id: string): Promise<Annotation | null>;
  getAnnotations(bookId: string, type?: AnnotationType): Promise<Annotation[]>;
  updateAnnotation(id: string, updates: Partial<Annotation>): Promise<void>;
  deleteAnnotation(id: string): Promise<void>;
  deleteAnnotationsByBook(bookId: string): Promise<void>;

  saveProgress(bookId: string, progress: ReadingProgress): Promise<void>;
  getProgress(bookId: string): Promise<ReadingProgress | null>;
  getAllProgress(): Promise<ReadingProgress[]>;
  deleteProgress(bookId: string): Promise<void>;

  saveCollection(collection: Collection): Promise<string>;
  getCollection(id: string): Promise<Collection | null>;
  getAllCollections(): Promise<Collection[]>;
  updateCollection(id: string, updates: Partial<Collection>): Promise<void>;
  deleteCollection(id: string): Promise<void>;

  saveSettings(settings: Settings): Promise<void>;
  getSettings(): Promise<Settings | null>;

  saveSession(session: ReadingSession): Promise<void>;
  getSessions(bookId?: string, dateFrom?: Date, dateTo?: Date): Promise<ReadingSession[]>;

  clearAll(): Promise<void>;
  getStorageSize(): Promise<number>;
}
