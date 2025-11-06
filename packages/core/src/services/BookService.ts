import { v4 as uuid } from "uuid";
import { Annotation } from "../models/Annotation";
import { Book } from "../models/Book";
import { BookStatus } from "../models/BookStatus";
import { ReadingProgress } from "../models/ReadingProgress";
import {
  IFileAdapter,
  type FileData,
  type FileOpenOptions,
} from "../interfaces/IFileAdapter";
import { IStorageAdapter } from "../interfaces/IStorageAdapter";
import { EPUBParser } from "../utils/EPUBParser";
import { CoverGenerator, type PlaceholderCoverOptions } from "../utils/CoverGenerator";

export interface AddBookOptions {
  extractMetadata?: boolean;
  extractCover?: boolean;
  createPlaceholderCover?: boolean;
  placeholderOptions?: PlaceholderCoverOptions;
}

export class BookService {
  constructor(
    private readonly storage: IStorageAdapter,
    private readonly fileAdapter: IFileAdapter
  ) {}

  async addBookFromFilePicker(
    overrides: Partial<Book> = {},
    options: FileOpenOptions = {},
    addOptions: AddBookOptions = {}
  ): Promise<string> {
    const file = await this.fileAdapter.openFile({
      accept: [".epub"],
      ...options,
    });

    const metadata = this.mergeMetadataWithFileData(file, overrides);
    return this.addBook(file.data, metadata, addOptions);
  }

  async addBooksFromFilePicker(
    overrides: Partial<Book> = {},
    options: FileOpenOptions = {},
    addOptions: AddBookOptions = {}
  ): Promise<string[]> {
    const files = await this.fileAdapter.openMultipleFiles({
      accept: [".epub"],
      multiple: true,
      ...options,
    });

    const ids: string[] = [];
    for (const file of files) {
      const metadata = this.mergeMetadataWithFileData(file, overrides);
      const id = await this.addBook(file.data, metadata, addOptions);
      ids.push(id);
    }

    return ids;
  }

  async addBook(
    file: ArrayBuffer,
    metadata: Partial<Book> = {},
    options: AddBookOptions = {}
  ): Promise<string> {
    const { metadata: mergedMetadata, coverDataUrl } = await this.prepareMetadata(
      file,
      metadata,
      options
    );
    const book = this.buildBookRecord(mergedMetadata, coverDataUrl, file.byteLength, options);
    if (!book.coverThumbnailUrl && book.coverUrl) {
      book.coverThumbnailUrl = await this.generateThumbnailSafe(book.coverUrl);
    }

    return this.storage.saveBook(book, file);
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<void> {
    const existing = await this.storage.getBook(id);
    if (!existing) {
      throw new Error(`Book with id ${id} not found`);
    }

    await this.storage.updateBook(id, updates);
  }

  async deleteBook(id: string): Promise<void> {
    await this.storage.deleteBook(id);
    await Promise.all([
      this.storage.deleteAnnotationsByBook(id),
      this.storage.deleteProgress(id),
    ]);
    await this.removeBookFromCollections(id);
  }

  async getBook(id: string): Promise<Book | null> {
    return this.storage.getBook(id);
  }

  async getAllBooks(): Promise<Book[]> {
    return this.storage.getAllBooks();
  }

  async searchBooks(query: string): Promise<Book[]> {
    return this.storage.searchBooks(query);
  }

  async getAnnotations(bookId: string): Promise<Annotation[]> {
    return this.storage.getAnnotations(bookId);
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    return this.storage.getProgress(bookId);
  }

  private async prepareMetadata(
    file: ArrayBuffer,
    metadata: Partial<Book>,
    options: AddBookOptions
  ): Promise<{ metadata: Partial<Book>; coverDataUrl?: string }> {
    const shouldParse = Boolean(options.extractMetadata || options.extractCover);
    if (!shouldParse) {
      return { metadata };
    }

    const parsed = await EPUBParser.parse(file, metadata);

    const mergedMetadata =
      options.extractMetadata === false
        ? metadata
        : {
            ...metadata,
            ...parsed.metadata,
          };

    const coverDataUrl =
      options.extractCover === false
        ? undefined
        : parsed.coverDataUrl ??
          (typeof parsed.metadata.coverUrl === "string" ? parsed.metadata.coverUrl : undefined);

    return {
      metadata: mergedMetadata,
      coverDataUrl,
    };
  }

  private buildBookRecord(
    metadata: Partial<Book>,
    coverDataUrl: string | undefined,
    fileSize: number,
    options: AddBookOptions
  ): Book {
    const normalized = this.normalizeMetadata(metadata, fileSize);

    const id = normalized.id ?? uuid();
    const title = this.cleanText(normalized.title) ?? "Untitled Book";
    const author = this.cleanText(normalized.author) ?? "Unknown Author";
    const status = this.normalizeStatus(normalized.status);
    const coverUrl =
      typeof coverDataUrl === "string" && coverDataUrl.length
        ? coverDataUrl
        : typeof normalized.coverUrl === "string"
        ? normalized.coverUrl
        : undefined;

    const book: Book = {
      ...normalized,
      id,
      title,
      author,
      status,
      fileSize: normalized.fileSize ?? fileSize,
      dateAdded: normalized.dateAdded ?? new Date(),
      coverUrl,
      coverThumbnailUrl: normalized.coverThumbnailUrl,
    };

    if (!book.coverUrl && options.createPlaceholderCover) {
      const placeholder = CoverGenerator.generatePlaceholder(book.title, options.placeholderOptions);
      book.coverUrl = placeholder;
      if (!book.coverThumbnailUrl) {
        book.coverThumbnailUrl = placeholder;
      }
    }

    return book;
  }

  private normalizeMetadata(
    metadata: Partial<Book>,
    fileSize: number
  ): Partial<Book> {
    const normalized: Partial<Book> = { ...metadata };

    normalized.fileSize = metadata.fileSize ?? fileSize;
    normalized.dateAdded = this.ensureDate(metadata.dateAdded) ?? new Date();
    normalized.lastOpened = this.ensureDate(metadata.lastOpened);
    normalized.publicationDate = this.ensureDate(metadata.publicationDate);

    normalized.coverUrl = this.cleanText(metadata.coverUrl);
    normalized.coverThumbnailUrl = this.cleanText(metadata.coverThumbnailUrl);

    if (metadata.tags) {
      const unique = new Set(
        metadata.tags.map((tag) => this.cleanText(tag)).filter(Boolean) as string[]
      );
      normalized.tags = Array.from(unique);
    }

    return normalized;
  }

  private normalizeStatus(status?: Book["status"] | string): BookStatus {
    if (!status) {
      return BookStatus.NOT_STARTED;
    }

    const candidates = Object.values(BookStatus);
    if (candidates.includes(status as BookStatus)) {
      return status as BookStatus;
    }

    const normalized = String(status).toLowerCase();
    const matched = candidates.find((value) => value === normalized);
    return matched ?? BookStatus.NOT_STARTED;
  }

  private ensureDate(value?: Date | string): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private cleanText(value?: string): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private mergeMetadataWithFileData(
    file: FileData,
    overrides: Partial<Book>
  ): Partial<Book> {
    const inferredTitle = this.cleanText(overrides.title) ?? this.inferTitle(file.name);
    return {
      ...overrides,
      title: inferredTitle,
      fileSize: overrides.fileSize ?? file.size,
    };
  }

  private inferTitle(filename: string): string {
    const withoutExtension = filename.replace(/\.[^./\\]+$/u, "");
    return withoutExtension || filename;
  }

  private async generateThumbnailSafe(coverUrl: string): Promise<string | undefined> {
    try {
      const thumbnail = await CoverGenerator.generateThumbnail(coverUrl, 160, 240, "#f8fafc");
      return thumbnail ?? undefined;
    } catch (error) {
      console.warn("BookService: thumbnail generation failed", error);
      return undefined;
    }
  }

  private async removeBookFromCollections(bookId: string): Promise<void> {
    const collections = await this.storage.getAllCollections();

    const updates = collections
      .filter((collection) => collection.bookIds.includes(bookId))
      .map((collection) => {
        const nextBookIds = collection.bookIds.filter((id) => id !== bookId);
        return this.storage.updateCollection(collection.id, {
          bookIds: nextBookIds,
          updatedAt: new Date(),
        });
      });

    await Promise.all(updates);
  }
}
