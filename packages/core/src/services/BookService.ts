import { v4 as uuid } from "uuid";
import { Annotation } from "../models/Annotation";
import { Book } from "../models/Book";
import { BookStatus } from "../models/BookStatus";
import { ReadingProgress } from "../models/ReadingProgress";
import { IFileAdapter } from "../interfaces/IFileAdapter";
import { IStorageAdapter } from "../interfaces/IStorageAdapter";

export interface AddBookOptions {
  extractMetadata?: boolean;
  createPlaceholderCover?: boolean;
}

export class BookService {
  constructor(
    private readonly storage: IStorageAdapter,
    private readonly fileAdapter: IFileAdapter
  ) {}

  async addBook(
    file: ArrayBuffer,
    metadata: Partial<Book> = {},
    options: AddBookOptions = {}
  ): Promise<string> {
    const mergedMetadata = options.extractMetadata
      ? await this.extractMetadata(file, metadata)
      : metadata;

    const book: Book = {
      id: mergedMetadata.id ?? uuid(),
      title: mergedMetadata.title ?? "Untitled Book",
      author: mergedMetadata.author ?? "Unknown Author",
      fileSize: mergedMetadata.fileSize ?? file.byteLength,
      dateAdded: mergedMetadata.dateAdded ?? new Date(),
      status: mergedMetadata.status ?? BookStatus.NOT_STARTED,
      ...mergedMetadata,
    };

    if (options.createPlaceholderCover && !book.coverUrl) {
      book.coverUrl = this.createPlaceholderCover(book.title);
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
    await this.storage.deleteAnnotationsByBook(id);
    await this.storage.deleteProgress(id);
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

  private async extractMetadata(
    _file: ArrayBuffer,
    fallback: Partial<Book>
  ): Promise<Partial<Book>> {
    // Phase 1 stub – actual implementation will leverage epub.js parsing.
    return fallback;
  }

  private createPlaceholderCover(title: string): string {
    const initials = title
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 3)
      .join("");

    // Data URL placeholder (solid color); replace with canvas generation later.
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%' height='100%' fill='%230069ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='white'>${initials || "EPUB"}</text></svg>`;
  }
}
