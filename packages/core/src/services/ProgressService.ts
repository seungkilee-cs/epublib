import { IStorageAdapter } from "../interfaces/IStorageAdapter";
import { LocationInfo } from "../models/LocationInfo";
import { ReadingProgress } from "../models/ReadingProgress";
import { ReadingSession } from "../models/ReadingSession";
import { BookStatistics, ReadingStatistics } from "../models/ReadingStatistics";

interface ProgressUpdateOptions {
  totalPages?: number;
  sessionStartTime?: Date;
}

export class ProgressService {
  private activeSessions = new Map<string, Date>();

  constructor(private readonly storage: IStorageAdapter) {}

  async updateProgress(
    bookId: string,
    location: LocationInfo,
    options: ProgressUpdateOptions = {}
  ): Promise<ReadingProgress> {
    if (!location.cfi) {
      throw new Error("Invalid location: missing CFI");
    }

    const progress: ReadingProgress = {
      bookId,
      cfi: location.cfi,
      percentage: Math.min(Math.max(location.percentage, 0), 1) * 100,
      currentPage: location.page,
      totalPages: options.totalPages ?? location.totalPages,
      currentChapter: location.chapter,
      chapterIndex: undefined,
      lastUpdated: new Date(),
      readingTime: options.sessionStartTime
        ? this.calculateSecondsBetween(new Date(), options.sessionStartTime)
        : 0,
      sessionStartTime: options.sessionStartTime,
    };

    await this.storage.saveProgress(bookId, progress);
    return progress;
  }

  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    return this.storage.getProgress(bookId);
  }

  async startSession(bookId: string): Promise<void> {
    this.activeSessions.set(bookId, new Date());
  }

  async endSession(
    bookId: string,
    pagesRead: number
  ): Promise<ReadingSession | null> {
    const start = this.activeSessions.get(bookId);
    if (!start) {
      return null;
    }

    const end = new Date();
    const session: ReadingSession = {
      bookId,
      startTime: start,
      endTime: end,
      pagesRead,
      duration: this.calculateSecondsBetween(end, start),
    };

    await this.storage.saveSession(session);
    this.activeSessions.delete(bookId);
    return session;
  }

  async getStatistics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ReadingStatistics> {
    const sessions = await this.storage.getSessions(undefined, dateFrom, dateTo);
    const progressList = await this.storage.getAllProgress();

    const totalReadingTime = sessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );

    const booksCompleted = progressList.filter(
      (progress) => progress.percentage >= 100
    ).length;

    const booksRead = new Set(sessions.map((session) => session.bookId)).size;

    const streaks = this.calculateStreaks(sessions);

    const averagePagesPerDay = this.calculateAveragePagesPerDay(sessions);

    return {
      totalReadingTime,
      booksInProgress: progressList.length - booksCompleted,
      booksCompleted,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      averagePagesPerDay,
      averageReadingSpeed: this.calculateAverageSpeed(sessions),
      booksRead,
      dailyGoal: undefined,
      weeklyGoal: undefined,
      readingHistory: sessions,
    };
  }

  async getBookStatistics(bookId: string): Promise<BookStatistics> {
    const sessions = await this.storage.getSessions(bookId);
    const progress = await this.storage.getProgress(bookId);

    const totalReadingTime = sessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );

    const pagesRead = sessions.reduce(
      (acc, session) => acc + session.pagesRead,
      0
    );

    return {
      bookId,
      totalReadingTime,
      lastReadAt: sessions.at(-1)?.endTime,
      pagesRead,
      annotationsCount: (await this.storage.getAnnotations(bookId)).length,
    };
  }

  private calculateAveragePagesPerDay(sessions: ReadingSession[]): number {
    const pagesByDate = new Map<string, number>();

    sessions.forEach((session) => {
      const dateKey = session.startTime.toISOString().split("T")[0];
      const total = pagesByDate.get(dateKey) ?? 0;
      pagesByDate.set(dateKey, total + session.pagesRead);
    });

    if (pagesByDate.size === 0) {
      return 0;
    }

    const totalPages = Array.from(pagesByDate.values()).reduce(
      (acc, pages) => acc + pages,
      0
    );

    return totalPages / pagesByDate.size;
  }

  private calculateAverageSpeed(sessions: ReadingSession[]): number {
    const totalPages = sessions.reduce((acc, session) => acc + session.pagesRead, 0);
    const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);

    if (totalDuration === 0) {
      return 0;
    }

    // pages per hour
    return (totalPages / totalDuration) * 3600;
  }

  private calculateStreaks(sessions: ReadingSession[]): {
    current: number;
    longest: number;
  } {
    if (sessions.length === 0) {
      return { current: 0, longest: 0 };
    }

    const days = Array.from(
      new Set(
        sessions.map((session) => session.startTime.toISOString().split("T")[0])
      )
    )
      .map((iso) => new Date(iso))
      .sort((a, b) => a.getTime() - b.getTime());

    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < days.length; i += 1) {
      const prev = days[i - 1];
      const current = days[i];

      const diff = this.calculateSecondsBetween(current, prev) / 86400;

      if (diff === 1) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }

    const today = new Date();
    const lastDay = days[days.length - 1];

    if (!lastDay || !this.isSameDay(today, lastDay)) {
      currentStreak = 0;
    }

    return { current: currentStreak, longest: longestStreak };
  }

  private calculateSecondsBetween(a: Date, b: Date): number {
    return Math.floor((a.getTime() - b.getTime()) / 1000);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
