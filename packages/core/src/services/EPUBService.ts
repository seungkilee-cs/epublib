import ePub, { Book, Rendition, Location } from "epubjs";
import type { LocationInfo } from "../models/LocationInfo";
import type { Theme } from "../models/Theme";
import { ViewMode } from "../models/ViewMode";

export interface EPUBServiceOptions {
  restoreLocation?: string;
  flow?: "paginated" | "scrolled";
}

type RawTocItem = {
  id?: string;
  label?: string;
  href?: string;
  subitems?: RawTocItem[];
};

export interface TocItem {
  id: string;
  label: string;
  href: string;
  subitems?: TocItem[];
}

export type RenditionThemeStyles = Record<string, Record<string, string>>;

export type EPUBEvent =
  | "relocated"
  | "rendered"
  | "layout"
  | "displayed"
  | "resized"
  | "click"
  | "keydown"
  | "keyup";

type EventCallback = (payload: unknown) => void;

export class EPUBService {
  private book: Book | null = null;

  private rendition: Rendition | null = null;

  private currentLocation: LocationInfo | null = null;

  isLoaded(): boolean {
    return Boolean(this.book);
  }

  async loadBook(data: ArrayBuffer): Promise<void> {
    try {
      this.book = ePub(data);
      await this.book.ready;
    } catch (error) {
      this.book = null;
      throw new Error(`Failed to load EPUB: ${(error as Error).message}`);
    }
  }

  async renderTo(
    element: HTMLElement,
    options: EPUBServiceOptions = {}
  ): Promise<void> {
    const book = this.ensureBook();

    try {
      this.rendition = book.renderTo(element, {
        width: "100%",
        height: "100%",
        flow: options.flow ?? "paginated",
      });
    } catch (error) {
      this.rendition = null;
      throw new Error(`Failed to render EPUB: ${(error as Error).message}`);
    }

    if (options.restoreLocation) {
      await this.safeDisplay(options.restoreLocation);
    } else {
      await this.safeDisplay();
    }

    this.rendition.on("relocated", (location: Location) => {
      this.currentLocation = this.mapLocation(location);
    });
  }

  async destroy(): Promise<void> {
    try {
      await this.rendition?.destroy();
    } finally {
      this.book = null;
      this.rendition = null;
      this.currentLocation = null;
    }
  }

  getRendition(): Rendition | null {
    return this.rendition;
  }

  getBook(): Book | null {
    return this.book;
  }

  getCurrentLocation(): LocationInfo | null {
    return this.currentLocation;
  }

  async nextPage(): Promise<void> {
    const rendition = this.ensureRendition();
    await rendition.next();
  }

  async prevPage(): Promise<void> {
    const rendition = this.ensureRendition();
    await rendition.prev();
  }

  async goTo(cfi: string): Promise<void> {
    await this.safeDisplay(cfi);
  }

  async goToHref(href: string): Promise<void> {
    await this.safeDisplay(href);
  }

  async getToc(): Promise<TocItem[]> {
    const book = this.ensureBook();

    const navigation = await book.loaded.navigation;
    return navigation.toc.map((item) => this.mapToc(item));
  }

  private mapLocation(location: Location): LocationInfo {
    return {
      cfi: location?.start?.cfi ?? "",
      percentage: location?.start?.percentage ?? 0,
      page: location?.start?.displayed?.page ?? 0,
      totalPages: location?.start?.displayed?.total ?? 0,
      chapter: location?.start?.href,
      chapterHref: location?.start?.href,
    };
  }

  private mapToc(item: RawTocItem): TocItem {
    const children = item.subitems?.length
      ? item.subitems.map((subItem: RawTocItem) => this.mapToc(subItem))
      : undefined;

    return {
      id: item.id ?? item.href ?? "",
      label: item.label ?? item.href ?? "",
      href: item.href ?? "",
      subitems: children,
    };
  }

  applyTheme(theme: Theme, styles: RenditionThemeStyles): void {
    const rendition = this.rendition;
    if (!rendition) {
      return;
    }

    const payload = styles as unknown as Record<string, string>;
    rendition.themes.register(theme, payload);
    rendition.themes.select(theme);
  }

  setViewMode(viewMode: ViewMode): void {
    const rendition = this.rendition;
    if (!rendition) {
      return;
    }

    const flow =
      viewMode === ViewMode.CONTINUOUS ? "scrolled" : "paginated";
    rendition.flow(flow);
  }

  setSpreadMode(spreadMode: ViewMode): void {
    const rendition = this.rendition;
    if (!rendition) {
      return;
    }

    const spread = (rendition as unknown as { spread?: (mode: string) => void }).spread;
    if (!spread) {
      return;
    }

    if (spreadMode === ViewMode.TWO_PAGE) {
      spread("auto");
    } else {
      spread("none");
    }
  }

  on(eventName: EPUBEvent, callback: EventCallback): void {
    this.rendition?.on(eventName, callback);
  }

  off(eventName: EPUBEvent, callback: EventCallback): void {
    this.rendition?.off(eventName, callback);
  }

  private ensureBook(): Book {
    if (!this.book) {
      throw new Error("EPUB book is not loaded");
    }
    return this.book;
  }

  private ensureRendition(): Rendition {
    if (!this.rendition) {
      throw new Error("EPUB rendition is not initialized");
    }
    return this.rendition;
  }

  private async safeDisplay(target?: string): Promise<void> {
    const rendition = this.ensureRendition();
    try {
      await rendition.display(target);
    } catch (error) {
      throw new Error(`Failed to display location: ${(error as Error).message}`);
    }
  }
}
