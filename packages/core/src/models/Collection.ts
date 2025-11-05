export interface Collection {
  id: string;
  name: string;
  description?: string;
  bookIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
