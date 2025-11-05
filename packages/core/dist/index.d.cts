import { Rendition, Book as Book$1 } from 'epubjs';

declare enum AnnotationType {
    BOOKMARK = "bookmark",
    HIGHLIGHT = "highlight",
    NOTE = "note"
}

declare enum HighlightColor {
    YELLOW = "yellow",
    GREEN = "green",
    BLUE = "blue",
    PINK = "pink",
    PURPLE = "purple"
}

interface AnnotationBase {
    id: string;
    bookId: string;
    type: AnnotationType;
    cfi: string;
    createdAt: Date;
    updatedAt: Date;
}
interface BookmarkAnnotation extends AnnotationBase {
    type: AnnotationType.BOOKMARK;
    label?: string;
}
interface HighlightAnnotation extends AnnotationBase {
    type: AnnotationType.HIGHLIGHT;
    cfiRange: string;
    content: string;
    color: HighlightColor;
    note?: string;
}
interface NoteAnnotation extends AnnotationBase {
    type: AnnotationType.NOTE;
    note: string;
    content?: string;
}
type Annotation = BookmarkAnnotation | HighlightAnnotation | NoteAnnotation;

declare enum BookStatus {
    NOT_STARTED = "not_started",
    READING = "reading",
    COMPLETED = "completed"
}

interface Book {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    isbn?: string;
    language?: string;
    publicationDate?: Date;
    description?: string;
    coverUrl?: string;
    fileSize: number;
    pageCount?: number;
    wordCount?: number;
    dateAdded: Date;
    lastOpened?: Date;
    status: BookStatus;
    tags?: string[];
}

interface Collection {
    id: string;
    name: string;
    description?: string;
    bookIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

declare enum LibraryView {
    GRID = "grid",
    LIST = "list",
    COMPACT = "compact"
}

interface LocationInfo {
    cfi: string;
    percentage: number;
    page: number;
    totalPages: number;
    chapter?: string;
    chapterHref?: string;
}

interface ReadingProgress {
    bookId: string;
    cfi: string;
    percentage: number;
    currentPage: number;
    totalPages: number;
    currentChapter?: string;
    chapterIndex?: number;
    lastUpdated: Date;
    readingTime: number;
    sessionStartTime?: Date;
}

interface ReadingSession {
    bookId: string;
    startTime: Date;
    endTime?: Date;
    pagesRead: number;
    duration: number;
}

interface BookStatistics {
    bookId: string;
    totalReadingTime: number;
    lastReadAt?: Date;
    pagesRead: number;
    annotationsCount: number;
}
interface ReadingStatistics {
    totalReadingTime: number;
    booksInProgress: number;
    booksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    averagePagesPerDay: number;
    averageReadingSpeed: number;
    booksRead: number;
    dailyGoal?: number;
    weeklyGoal?: number;
    readingHistory: ReadingSession[];
}

interface SearchResult {
    id: string;
    bookId: string;
    cfi: string;
    excerpt: string;
    chapter?: string;
    score: number;
}

declare enum Theme {
    LIGHT = "light",
    DARK = "dark",
    SEPIA = "sepia",
    BLACK = "black",
    CUSTOM = "custom"
}

declare enum ViewMode {
    PAGINATED = "paginated",
    CONTINUOUS = "continuous",
    SINGLE_PAGE = "single",
    TWO_PAGE = "double"
}

declare enum TextAlign {
    LEFT = "left",
    JUSTIFY = "justify",
    RIGHT = "right",
    CENTER = "center"
}

interface CustomTheme {
    backgroundColor: string;
    textColor: string;
    linkColor: string;
    highlightColor: string;
}
interface Margins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
interface Settings {
    theme: Theme;
    customTheme?: CustomTheme;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    textAlign: TextAlign;
    paragraphSpacing: number;
    overrideBookStyles: boolean;
    viewMode: ViewMode;
    pageWidth: number;
    margins: Margins;
    maxContentWidth: number;
    autoSaveInterval: number;
    gesturesEnabled: boolean;
    animationsEnabled: boolean;
    defaultLibraryView: LibraryView;
    sidebarPosition: "left" | "right";
    enableTelemetry: boolean;
}

interface FileOpenOptions {
    accept?: string[];
    multiple?: boolean;
}
interface FileSaveOptions {
    defaultPath?: string;
    filters?: {
        name: string;
        extensions: string[];
    }[];
}
interface FileData {
    name: string;
    data: ArrayBuffer;
    size: number;
    type: string;
}
interface IFileAdapter {
    openFile(options?: FileOpenOptions): Promise<FileData>;
    openMultipleFiles(options?: FileOpenOptions): Promise<FileData[]>;
    saveFile(data: Blob, filename: string, options?: FileSaveOptions): Promise<void>;
}

interface StorageInitializationOptions {
    dbName?: string;
}
interface IStorageAdapter {
    initialize(options?: StorageInitializationOptions): Promise<void>;
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

interface EPUBServiceOptions {
    restoreLocation?: string;
    flow?: "paginated" | "scrolled";
}
interface TocItem {
    id: string;
    label: string;
    href: string;
    subitems?: TocItem[];
}
type EPUBEvent = "relocated" | "rendered" | "layout" | "displayed" | "resized" | "click" | "keydown" | "keyup";
type EventCallback = (payload: unknown) => void;
declare class EPUBService {
    private book;
    private rendition;
    private currentLocation;
    isLoaded(): boolean;
    loadBook(data: ArrayBuffer): Promise<void>;
    renderTo(element: HTMLElement, options?: EPUBServiceOptions): Promise<void>;
    destroy(): Promise<void>;
    getRendition(): Rendition | null;
    getBook(): Book$1 | null;
    getCurrentLocation(): LocationInfo | null;
    nextPage(): Promise<void>;
    prevPage(): Promise<void>;
    goTo(cfi: string): Promise<void>;
    goToHref(href: string): Promise<void>;
    getToc(): Promise<TocItem[]>;
    private mapLocation;
    private mapToc;
    applyTheme(theme: Theme, styles: Record<string, string>): void;
    setViewMode(viewMode: ViewMode): void;
    on(eventName: EPUBEvent, callback: EventCallback): void;
    off(eventName: EPUBEvent, callback: EventCallback): void;
    private ensureBook;
    private ensureRendition;
    private safeDisplay;
}

interface AddBookOptions {
    extractMetadata?: boolean;
    createPlaceholderCover?: boolean;
}
declare class BookService {
    private readonly storage;
    private readonly fileAdapter;
    constructor(storage: IStorageAdapter, fileAdapter: IFileAdapter);
    addBook(file: ArrayBuffer, metadata?: Partial<Book>, options?: AddBookOptions): Promise<string>;
    updateBook(id: string, updates: Partial<Book>): Promise<void>;
    deleteBook(id: string): Promise<void>;
    getBook(id: string): Promise<Book | null>;
    getAllBooks(): Promise<Book[]>;
    searchBooks(query: string): Promise<Book[]>;
    getAnnotations(bookId: string): Promise<Annotation[]>;
    getProgress(bookId: string): Promise<ReadingProgress | null>;
    private extractMetadata;
    private createPlaceholderCover;
}

interface ProgressUpdateOptions {
    totalPages?: number;
    sessionStartTime?: Date;
}
declare class ProgressService {
    private readonly storage;
    private activeSessions;
    constructor(storage: IStorageAdapter);
    updateProgress(bookId: string, location: LocationInfo, options?: ProgressUpdateOptions): Promise<ReadingProgress>;
    getProgress(bookId: string): Promise<ReadingProgress | null>;
    startSession(bookId: string): Promise<void>;
    endSession(bookId: string, pagesRead: number): Promise<ReadingSession | null>;
    getStatistics(dateFrom?: Date, dateTo?: Date): Promise<ReadingStatistics>;
    getBookStatistics(bookId: string): Promise<BookStatistics>;
    private calculateAveragePagesPerDay;
    private calculateAverageSpeed;
    private calculateStreaks;
    private calculateSecondsBetween;
    private isSameDay;
}

export { type AddBookOptions, type Annotation, type AnnotationBase, AnnotationType, type Book, BookService, type BookStatistics, BookStatus, type BookmarkAnnotation, type Collection, type CustomTheme, type EPUBEvent, EPUBService, type EPUBServiceOptions, type FileData, type FileOpenOptions, type FileSaveOptions, type HighlightAnnotation, HighlightColor, type IFileAdapter, type IStorageAdapter, LibraryView, type LocationInfo, type Margins, type NoteAnnotation, ProgressService, type ReadingProgress, type ReadingSession, type ReadingStatistics, type SearchResult, type Settings, type StorageInitializationOptions, TextAlign, Theme, type TocItem, ViewMode };
