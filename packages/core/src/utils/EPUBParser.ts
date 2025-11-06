import ePub, { Book as EPUBJSBook } from "epubjs";
import type { Book } from "../models/Book";

export interface ParsedEPUBMetadata {
  metadata: Partial<Book>;
  coverDataUrl?: string;
  tableOfContents?: TocItem[];
}

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

type RawTocItem = {
  id?: string;
  label?: string;
  href?: string;
  subitems?: RawTocItem[];
};

type EPUBJSBookWithInternals = EPUBJSBook & {
  destroy?: () => Promise<void> | void;
  coverUrl?: () => Promise<string | null>;
  loaded: {
    metadata: Promise<Record<string, unknown>>;
    navigation: Promise<{ toc: RawTocItem[] }>;
  };
  archive?: { revokeUrl?: (url: string) => void };
};

type BookStringKeys = {
  [Key in keyof Book]: Book[Key] extends string | undefined ? Key : never;
}[keyof Book];

type BookDateKeys = {
  [Key in keyof Book]: Book[Key] extends Date | undefined ? Key : never;
}[keyof Book];

export class EPUBParser {
  static async parseMetadata(
    file: ArrayBuffer,
    fallback: Partial<Book> = {}
  ): Promise<Partial<Book>> {
    const result = await this.parse(file, fallback);
    return result.metadata;
  }

  static async extractCover(file: ArrayBuffer): Promise<string | null> {
    const { coverDataUrl } = await this.parse(file, {});
    return coverDataUrl ?? null;
  }

  static async extractTableOfContents(file: ArrayBuffer): Promise<TocItem[] | null> {
    const { tableOfContents } = await this.parse(file, {});
    return tableOfContents ?? null;
  }

  static async parse(
    file: ArrayBuffer,
    fallback: Partial<Book> = {}
  ): Promise<ParsedEPUBMetadata> {
    if (!this.isEnvironmentSupported()) {
      return { metadata: { ...fallback } };
    }

    try {
      return await this.withBook(file, async (book) => {
        const metadata = await this.extractMetadataFromBook(book, fallback);
        const coverDataUrl = await this.safeExtractCover(book);
        const tableOfContents = await this.safeExtractToc(book);

        if (coverDataUrl && !metadata.coverUrl) {
          metadata.coverUrl = coverDataUrl;
        }

        return {
          metadata,
          coverDataUrl: coverDataUrl ?? undefined,
          tableOfContents: tableOfContents ?? undefined,
        };
      });
    } catch (error) {
      console.warn("EPUBParser.parse failed", error);
      return { metadata: { ...fallback } };
    }
  }

  private static isEnvironmentSupported(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return typeof FileReader !== "undefined" && typeof Blob !== "undefined";
  }

  private static async withBook<T>(
    file: ArrayBuffer,
    handler: (book: EPUBJSBookWithInternals) => Promise<T>
  ): Promise<T> {
    let book: EPUBJSBookWithInternals | null = null;

    try {
      book = ePub(file) as EPUBJSBookWithInternals;
      await book.ready;
      return await handler(book);
    } finally {
      await this.safeDestroy(book);
    }
  }

  private static async extractMetadataFromBook(
    book: EPUBJSBookWithInternals,
    fallback: Partial<Book>
  ): Promise<Partial<Book>> {
    const metadataRecord = await book.loaded.metadata.catch(() => undefined as unknown);
    if (!metadataRecord || typeof metadataRecord !== "object") {
      return { ...fallback };
    }

    const result: Partial<Book> = { ...fallback };
    const mutableResult = result as Record<string, unknown>;

    const setString = (key: BookStringKeys | undefined, value?: unknown) => {
      if (typeof key !== "string") {
        return;
      }
      if (typeof value !== "string") {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      mutableResult[key as string] = trimmed;
    };

    const setDate = (key: BookDateKeys | undefined, value?: unknown) => {
      if (typeof key !== "string") {
        return;
      }
      if (typeof value !== "string") {
        return;
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      mutableResult[key as string] = parsed;
    };

    const metadataAny = metadataRecord as Record<string, unknown>;

    setString("title", metadataAny.title ?? metadataAny.bookTitle);

    const creators = this.ensureArray(metadataAny.creator ?? metadataAny.creators);
    if (creators.length) {
      setString("author", creators[0]);
    }

    setString("description", metadataAny.description ?? metadataAny.bookDescription);
    setString("publisher", metadataAny.publisher);
    setString("language", metadataAny.language);

    const identifiers = this.ensureArray(metadataAny.identifier ?? metadataAny.identifiers);
    const isbnCandidate = identifiers.find((identifier) =>
      typeof identifier === "string" && /^(97(8|9))?\d{9}(\d|X)$/u.test(identifier.replace(/[^0-9X]/giu, ""))
    );
    if (isbnCandidate && typeof isbnCandidate === "string") {
      const cleaned = isbnCandidate.replace(/[^0-9X]/giu, "");
      if (cleaned) {
        result.isbn = cleaned;
      }
    }

    setDate("publicationDate", metadataAny.pubdate ?? metadataAny.pubDate ?? metadataAny.published);

    const subjectValues = this.ensureArray(metadataAny.subject ?? metadataAny.keywords);
    if (subjectValues.length) {
      const normalizedSubjects = subjectValues
        .flatMap((subject) =>
          typeof subject === "string"
            ? subject
                .split(/[;,]/u)
                .map((item) => item.trim())
                .filter(Boolean)
            : []
        )
        .filter(Boolean);

      if (normalizedSubjects.length) {
        const uniqueSubjects = Array.from(new Set(normalizedSubjects));
        result.tags = uniqueSubjects;
      }
    }

    if (!result.author) {
      const contributors = this.ensureArray(metadataAny.contributor);
      if (contributors.length) {
        setString("author", contributors[0]);
      }
    }

    return result;
  }

  private static ensureArray(value: unknown): unknown[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }

  private static async safeExtractCover(book: EPUBJSBookWithInternals): Promise<string | null> {
    if (typeof fetch === "undefined") {
      return null;
    }

    let coverUrl: string | null = null;
    try {
      const coverUrlFn = book.coverUrl;
      if (typeof coverUrlFn !== "function") {
        return null;
      }

      coverUrl = await coverUrlFn.call(book);
      if (!coverUrl) {
        return null;
      }

      const response = await fetch(coverUrl);
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return await this.blobToDataUrl(blob);
    } catch (error) {
      console.warn("EPUBParser: cover extraction failed", error);
      return null;
    } finally {
      if (coverUrl) {
        const revoke = book.archive?.revokeUrl;
        if (typeof revoke === "function") {
          try {
            revoke.call(book.archive, coverUrl);
          } catch (error) {
            console.warn("EPUBParser: failed to revoke cover URL", error);
          }
        }
      }
    }
  }

  private static async safeExtractToc(book: EPUBJSBookWithInternals): Promise<TocItem[] | null> {
    const navigation = await book.loaded.navigation.catch(() => undefined);
    if (!navigation?.toc?.length) {
      return null;
    }

    const mapItem = (item: RawTocItem): TocItem => {
      const children = item.subitems?.length ? item.subitems.map(mapItem) : undefined;
      return {
        id: item.id ?? item.href ?? "",
        label: item.label ?? item.href ?? "",
        href: item.href ?? "",
        subitems: children,
      };
    };

    return navigation.toc.map(mapItem);
  }

  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Cover data conversion failed"));
        }
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Cover data read failed"));
      };
      reader.readAsDataURL(blob);
    });
  }

  private static async safeDestroy(book: EPUBJSBookWithInternals | null): Promise<void> {
    if (!book) {
      return;
    }
    const destroy = book.destroy;
    if (typeof destroy === "function") {
      try {
        await destroy.call(book);
      } catch (error) {
        console.warn("EPUBParser: failed to destroy book", error);
      }
    }
  }
}
