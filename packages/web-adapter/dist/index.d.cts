import { IFileAdapter, FileOpenOptions, FileData, FileSaveOptions, IStorageAdapter, StorageInitializationOptions, Book, Annotation, AnnotationType, ReadingProgress, Collection, Settings, ReadingSession } from '@epub-reader/core';

declare class BrowserFileAdapter implements IFileAdapter {
    openFile(options?: FileOpenOptions): Promise<FileData>;
    openMultipleFiles(options?: FileOpenOptions): Promise<FileData[]>;
    saveFile(data: Blob, filename: string, options?: FileSaveOptions): Promise<void>;
}

declare class IndexedDBStorageAdapter implements IStorageAdapter {
    private dbPromise;
    private dbName;
    initialize(options?: StorageInitializationOptions): Promise<void>;
    private db;
    saveBook(book: Book, file: ArrayBuffer): Promise<string>;
    getBook(id: string): Promise<Book | null>;
    getAllBooks(): Promise<Book[]>;
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

export { BrowserFileAdapter, IndexedDBStorageAdapter };
