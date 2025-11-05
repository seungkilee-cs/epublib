declare module "epubjs" {
  export interface TocItem {
    id?: string;
    label?: string;
    href?: string;
    subitems?: TocItem[];
  }

  export interface Navigation {
    toc: TocItem[];
  }

  export interface Themes {
    register(name: string, styles: Record<string, string>): void;
    select(name: string): void;
  }

  export interface RenditionOptions {
    width?: number | string;
    height?: number | string;
    flow?: "paginated" | "scrolled" | "scrolled-doc";
  }

  export interface Rendition {
    display(target?: string): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    flow(flow: "paginated" | "scrolled" | "scrolled-doc"): void;
    on(eventName: string, callback: (location: Location) => void): void;
    off(eventName: string, callback: (location: Location) => void): void;
    destroy(): Promise<void>;
    themes: Themes;
  }

  export interface DisplayedLocation {
    page?: number;
    total?: number;
  }

  export interface Location {
    start?: {
      cfi?: string;
      href?: string;
      index?: number;
      displayed?: DisplayedLocation;
      percentage?: number;
    };
  }

  export interface Book {
    renderTo(element: HTMLElement, options?: RenditionOptions): Rendition;
    ready: Promise<void>;
    loaded: {
      navigation: Promise<Navigation>;
    };
  }

  export default function ePub(input?: ArrayBuffer | string): Book;
}
