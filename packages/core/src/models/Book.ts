import { BookStatus } from "./BookStatus";

export interface Book {
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
