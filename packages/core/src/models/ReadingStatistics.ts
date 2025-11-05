import { ReadingSession } from "./ReadingSession";

export interface BookStatistics {
  bookId: string;
  totalReadingTime: number;
  lastReadAt?: Date;
  pagesRead: number;
  annotationsCount: number;
}

export interface ReadingStatistics {
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
