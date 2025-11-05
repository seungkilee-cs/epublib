import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookService } from "../BookService";
import type { IStorageAdapter } from "../../interfaces/IStorageAdapter";
import type { IFileAdapter } from "../../interfaces/IFileAdapter";
import type { Book } from "../../models/Book";
import { BookStatus } from "../../models/BookStatus";

function createStorageMock() {
  const saveBook = vi.fn(async (book: Book, _file: ArrayBuffer) => book.id);
  const getBook = vi.fn(async (_id: string) => null as Book | null);
  const updateBook = vi.fn(async (_id: string, _updates: Partial<Book>) => {});
  const deleteBook = vi.fn(async (_id: string) => {});
  const deleteAnnotationsByBook = vi.fn(async (_id: string) => {});
  const deleteProgress = vi.fn(async (_id: string) => {});

  const adapter = {
    saveBook,
    getBook,
    updateBook,
    deleteBook,
    deleteAnnotationsByBook,
    deleteProgress,
    getAllBooks: vi.fn(),
    searchBooks: vi.fn(),
    saveAnnotation: vi.fn(),
    getAnnotation: vi.fn(),
    getAnnotations: vi.fn(),
    updateAnnotation: vi.fn(),
    deleteAnnotation: vi.fn(),
    saveProgress: vi.fn(),
    getProgress: vi.fn(),
    getAllProgress: vi.fn(),
    saveCollection: vi.fn(),
    getCollection: vi.fn(),
    getAllCollections: vi.fn(),
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
    saveSettings: vi.fn(),
    getSettings: vi.fn(),
    saveSession: vi.fn(),
    getSessions: vi.fn(),
    clearAll: vi.fn(),
    getStorageSize: vi.fn(),
    initialize: vi.fn(),
  } as unknown as IStorageAdapter;

  return {
    adapter,
    mocks: {
      saveBook,
      getBook,
      updateBook,
      deleteBook,
      deleteAnnotationsByBook,
      deleteProgress,
    },
  };
}

function createFileAdapterMock() {
  const openFile = vi.fn();
  const openMultipleFiles = vi.fn();
  const saveFile = vi.fn();

  return {
    adapter: {
      openFile: openFile as IFileAdapter["openFile"],
      openMultipleFiles: openMultipleFiles as IFileAdapter["openMultipleFiles"],
      saveFile: saveFile as IFileAdapter["saveFile"],
    },
    mocks: { openFile, openMultipleFiles, saveFile },
  };
}

describe("BookService", () => {
  let storage: IStorageAdapter;
  let storageMocks: ReturnType<typeof createStorageMock>["mocks"];
  let fileAdapter: IFileAdapter;
  let service: BookService;
  const encoder = new TextEncoder();

  beforeEach(() => {
    const storageSetup = createStorageMock();
    storage = storageSetup.adapter;
    storageMocks = storageSetup.mocks;
    fileAdapter = createFileAdapterMock().adapter;
    service = new BookService(storage, fileAdapter);
  });

  it("saves a book with generated defaults and placeholder cover when requested", async () => {
    const buffer = encoder.encode("sample").buffer;
    const metadata: Partial<Book> = {
      id: "book-123",
      title: "Sample Book",
      author: "Author",
      fileSize: 0,
      dateAdded: new Date("2023-01-01T00:00:00Z"),
    };

    storageMocks.saveBook.mockResolvedValue("book-123");

    const result = await service.addBook(buffer, metadata, {
      createPlaceholderCover: true,
    });

    expect(result).toBe("book-123");
    expect(storageMocks.saveBook).toHaveBeenCalledTimes(1);
    const [savedBook, savedFile] = storageMocks.saveBook.mock.calls[0];
    expect(savedFile).toBe(buffer);
    expect(savedBook).toEqual(
      expect.objectContaining({
        id: "book-123",
        title: "Sample Book",
        author: "Author",
        status: BookStatus.NOT_STARTED,
      })
    );
    expect(savedBook.coverUrl).toMatch(/data:image\/svg\+xml/);
  });

  it("updates an existing book", async () => {
    const existing: Book = {
      id: "existing",
      title: "Original",
      author: "Author",
      fileSize: 100,
      dateAdded: new Date(),
      status: BookStatus.READING,
    };

    storageMocks.getBook.mockResolvedValue(existing);

    await service.updateBook("existing", { title: "Updated" });

    expect(storageMocks.getBook).toHaveBeenCalledWith("existing");
    expect(storageMocks.updateBook).toHaveBeenCalledWith("existing", {
      title: "Updated",
    });
  });

  it("throws when updating a non-existent book", async () => {
    storageMocks.getBook.mockResolvedValue(null);

    await expect(service.updateBook("missing", { title: "Nope" })).rejects.toThrow(
      /not found/
    );
    expect(storageMocks.updateBook).not.toHaveBeenCalled();
  });

  it("deletes a book and associated data", async () => {
    await service.deleteBook("book-1");

    expect(storageMocks.deleteBook).toHaveBeenCalledWith("book-1");
    expect(storageMocks.deleteAnnotationsByBook).toHaveBeenCalledWith("book-1");
    expect(storageMocks.deleteProgress).toHaveBeenCalledWith("book-1");
  });
});
