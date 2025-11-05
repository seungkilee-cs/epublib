
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import ePub from "epubjs";
import { EPUBService } from "../EPUBService";
import { ViewMode } from "../../models/ViewMode";
import { Theme } from "../../models/Theme";

vi.mock("epubjs", () => ({
  __esModule: true,
  default: vi.fn(),
}));

const ePubMock = vi.mocked(ePub);

const documentStub = {
  createElement: vi.fn(() => ({ style: {} } as Partial<HTMLElement> as HTMLElement)),
};

type RelocationHandler = (location: {
  start?: {
    cfi?: string;
    href?: string;
    percentage?: number;
    displayed?: { page?: number; total?: number };
  };
}) => void;

describe("EPUBService", () => {
  let service: EPUBService;
  let events: Record<string, RelocationHandler>;
  let mockRendition: any;
  let mockBook: any;

  beforeAll(() => {
    vi.stubGlobal("document", documentStub);
  });

  function setupMocks(): void {
    events = {};

    mockRendition = {
      display: vi.fn().mockResolvedValue(undefined),
      next: vi.fn().mockResolvedValue(undefined),
      prev: vi.fn().mockResolvedValue(undefined),
      flow: vi.fn(),
      on: vi.fn((event: string, handler: RelocationHandler) => {
        events[event] = handler;
      }),
      off: vi.fn((event: string) => {
        delete events[event];
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
      themes: {
        register: vi.fn(),
        select: vi.fn(),
      },
    };

    const renderToMock = vi.fn().mockImplementation(() => mockRendition);

    mockBook = {
      ready: Promise.resolve(),
      renderTo: renderToMock,
      loaded: {
        navigation: Promise.resolve({
          toc: [
            {
              id: "1",
              label: "Chapter 1",
              href: "chapter1.xhtml",
              subitems: [
                { id: "1-1", label: "Section", href: "section.xhtml" },
              ],
            },
          ],
        }),
      },
    };

    ePubMock.mockImplementation(() => mockBook);
  }

  beforeEach(() => {
    ePubMock.mockReset();
    setupMocks();
    service = new EPUBService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("loads an EPUB and reports as loaded", async () => {
    await service.loadBook(new ArrayBuffer(0));

    expect(ePubMock).toHaveBeenCalledTimes(1);
    expect(service.isLoaded()).toBe(true);
  });

  it("propagates load failures and resets state", async () => {
    ePubMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await expect(service.loadBook(new ArrayBuffer(0))).rejects.toThrow(
      /Failed to load EPUB/
    );
    expect(service.isLoaded()).toBe(false);
  });

  it("renders to an element and updates current location on relocation", async () => {
    await service.loadBook(new ArrayBuffer(0));
    const element = document.createElement("div");

    await service.renderTo(element, { restoreLocation: "cfi" });

    expect(mockBook.renderTo).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ flow: "paginated" })
    );
    expect(mockRendition.display).toHaveBeenCalledWith("cfi");

    const relocation = events.relocated;
    expect(relocation).toBeDefined();

    relocation?.({
      start: {
        cfi: "epubcfi",
        percentage: 0.5,
        displayed: { page: 5, total: 10 },
        href: "chapter.xhtml",
      },
    });

    expect(service.getCurrentLocation()).toEqual({
      cfi: "epubcfi",
      percentage: 0.5,
      page: 5,
      totalPages: 10,
      chapter: "chapter.xhtml",
      chapterHref: "chapter.xhtml",
    });
  });

  it("navigates pages and toggles view modes", async () => {
    await service.loadBook(new ArrayBuffer(0));
    await service.renderTo(document.createElement("div"));

    await service.nextPage();
    await service.prevPage();
    service.setViewMode(ViewMode.CONTINUOUS);

    expect(mockRendition.next).toHaveBeenCalled();
    expect(mockRendition.prev).toHaveBeenCalled();
    expect(mockRendition.flow).toHaveBeenCalledWith("scrolled");
  });

  it("applies themes only when a rendition is active", async () => {
    service.applyTheme(Theme.DARK, { color: "black" });
    expect(mockRendition.themes.register).not.toHaveBeenCalled();

    await service.loadBook(new ArrayBuffer(0));
    await service.renderTo(document.createElement("div"));

    service.applyTheme(Theme.DARK, { color: "black" });
    expect(mockRendition.themes.register).toHaveBeenCalledWith(Theme.DARK, { color: "black" });
    expect(mockRendition.themes.select).toHaveBeenCalledWith(Theme.DARK);
  });

  it("returns mapped table of contents", async () => {
    await service.loadBook(new ArrayBuffer(0));

    const toc = await service.getToc();

    expect(toc).toEqual([
      {
        id: "1",
        label: "Chapter 1",
        href: "chapter1.xhtml",
        subitems: [
          { id: "1-1", label: "Section", href: "section.xhtml" },
        ],
      },
    ]);
  });

  it("destroys the rendition and clears state", async () => {
    await service.loadBook(new ArrayBuffer(0));
    await service.renderTo(document.createElement("div"));

    await service.destroy();

    expect(mockRendition.destroy).toHaveBeenCalled();
    expect(service.isLoaded()).toBe(false);
    expect(service.getCurrentLocation()).toBeNull();
  });
});
