export interface ReadingSession {
  bookId: string;
  startTime: Date;
  endTime?: Date;
  pagesRead: number;
  duration: number;
}
