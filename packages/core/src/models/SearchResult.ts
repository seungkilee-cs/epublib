export interface SearchResult {
  id: string;
  bookId: string;
  cfi: string;
  excerpt: string;
  chapter?: string;
  score: number;
}
