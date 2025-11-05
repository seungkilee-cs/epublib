import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressService } from "../ProgressService";
import type { IStorageAdapter } from "../../interfaces/IStorageAdapter";
import type { LocationInfo } from "../../models/LocationInfo";
import type { ReadingProgress } from "../../models/ReadingProgress";
import type { ReadingSession } from "../../models/ReadingSession";

function createStorageMock() {
  return {
    saveProgress: vi.fn(),
    getProgress: vi.fn(),
    getAllProgress: vi.fn(),
    saveSession: vi.fn(),
    getSessions: vi.fn(),
  } as unknown as Pick<
    IStorageAdapter,
    "saveProgress" | "getProgress" | "getAllProgress" | "saveSession" | "getSessions"
  >;
}

describe("ProgressService", () => {
  let storage: ReturnType<typeof createStorageMock>;
  let service: ProgressService;

  beforeEach(() => {
    storage = createStorageMock();
    service = new ProgressService(storage as unknown as IStorageAdapter);
  });

  it("clamps and persists progress", async () => {
    vi.useFakeTimers();
    const location: LocationInfo = {
      cfi: "epubcfi(/6/2[chapter]!/4/2/14)",
      percentage: 1.2,
      page: 5,
      totalPages: 10,
      chapter: "chapter-1",
    };

    const now = new Date();
    vi.setSystemTime(now);

    (storage.saveProgress as any).mockResolvedValue(undefined);

    const result = await service.updateProgress("book-1", location);

    expect(storage.saveProgress).toHaveBeenCalledWith(
      "book-1",
      expect.objectContaining<Partial<ReadingProgress>>({
        bookId: "book-1",
        cfi: location.cfi,
        percentage: 100,
        currentPage: 5,
        totalPages: 10,
        currentChapter: "chapter-1",
      })
    );
    const savedProgress = (storage.saveProgress as any).mock.calls[0][1] as ReadingProgress;
    expect(savedProgress.lastUpdated).toBeInstanceOf(Date);
    expect(result.percentage).toBe(100);
    vi.useRealTimers();
  });

  it("tracks sessions between start and end", async () => {
    vi.useFakeTimers();
    const start = new Date("2024-01-01T10:00:00Z");
    const end = new Date("2024-01-01T10:45:00Z");
    vi.setSystemTime(start);
    await service.startSession("book-1");

    vi.setSystemTime(end);
    (storage.saveSession as any).mockResolvedValue(undefined);

    const session = await service.endSession("book-1", 25);

    expect(session).toEqual(
      expect.objectContaining({
        bookId: "book-1",
        pagesRead: 25,
      })
    );
    expect(session?.duration).toBe(2700);
    vi.useRealTimers();
  });

  it("returns reading statistics", async () => {
    const sessions: ReadingSession[] = [
      {
        bookId: "book-1",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T10:30:00Z"),
        pagesRead: 30,
        duration: 1800,
      },
    ];

    const progress: ReadingProgress[] = [
      {
        bookId: "book-1",
        cfi: "cfi",
        percentage: 100,
        currentPage: 10,
        totalPages: 10,
        currentChapter: "chapter",
        chapterIndex: undefined,
        lastUpdated: new Date("2024-01-01T11:00:00Z"),
        readingTime: 3600,
        sessionStartTime: undefined,
      },
    ];

    (storage.getSessions as any).mockResolvedValue(sessions);
    (storage.getAllProgress as any).mockResolvedValue(progress);

    const stats = await service.getStatistics();

    expect(stats.totalReadingTime).toBe(1800);
    expect(stats.booksCompleted).toBe(1);
    expect(stats.booksRead).toBe(1);
    expect(stats.averagePagesPerDay).toBe(30);
  });
});
