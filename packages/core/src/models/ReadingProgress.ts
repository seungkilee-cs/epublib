export interface ReadingProgress {
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
