import { AnnotationType } from "./AnnotationType";
import { HighlightColor } from "./HighlightColor";

export interface AnnotationBase {
  id: string;
  bookId: string;
  type: AnnotationType;
  cfi: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkAnnotation extends AnnotationBase {
  type: AnnotationType.BOOKMARK;
  label?: string;
}

export interface HighlightAnnotation extends AnnotationBase {
  type: AnnotationType.HIGHLIGHT;
  cfiRange: string;
  content: string;
  color: HighlightColor;
  note?: string;
}

export interface NoteAnnotation extends AnnotationBase {
  type: AnnotationType.NOTE;
  note: string;
  content?: string;
}

export type Annotation =
  | BookmarkAnnotation
  | HighlightAnnotation
  | NoteAnnotation;
