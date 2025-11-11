import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mocked } from "vitest";
import { SettingsService } from "../SettingsService";
import { IStorageAdapter } from "../../interfaces/IStorageAdapter";
import { DEFAULT_SETTINGS, Settings } from "../../models/Settings";
import { Theme } from "../../models/Theme";
import { ViewMode } from "../../models/ViewMode";
import { TextAlign } from "../../models/TextAlign";
import { LibraryView } from "../../models/LibraryView";
import { EPUBService } from "../EPUBService";

const epubServiceMock = {
  setViewMode: vi.fn(),
  applyTheme: vi.fn(),
};

vi.mock("../EPUBService", () => ({
  EPUBService: vi.fn().mockImplementation(() => epubServiceMock),
}));

describe("SettingsService", () => {
  let storage: Mocked<IStorageAdapter>;
  let service: SettingsService;

  beforeEach(() => {
    epubServiceMock.setViewMode.mockReset();
    epubServiceMock.applyTheme.mockReset();

    storage = {
      initialize: vi.fn(),
      saveBook: vi.fn(),
      getBook: vi.fn(),
      getAllBooks: vi.fn(),
      getBookFile: vi.fn(),
      updateBook: vi.fn(),
      deleteBook: vi.fn(),
      searchBooks: vi.fn(),
      saveAnnotation: vi.fn(),
      getAnnotation: vi.fn(),
      getAnnotations: vi.fn(),
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      deleteAnnotationsByBook: vi.fn(),
      saveProgress: vi.fn(),
      getProgress: vi.fn(),
      getAllProgress: vi.fn(),
      deleteProgress: vi.fn(),
      saveCollection: vi.fn(),
      getCollection: vi.fn(),
      getAllCollections: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      saveSettings: vi.fn(),
      getSettings: vi.fn(),
      saveSession: vi.fn(),
      getSessions: vi.fn(),
      clearAll: vi.fn(),
      getStorageSize: vi.fn(),
    } as unknown as Mocked<IStorageAdapter>;

    service = new SettingsService(storage);
  });

  it("returns defaults when nothing stored", async () => {
    storage.getSettings.mockResolvedValueOnce(null);

    const settings = await service.loadSettings();

    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(storage.getSettings).toHaveBeenCalledTimes(1);
  });

  it("normalizes invalid values and persists updates", async () => {
    const stored: Partial<Settings> = {
      fontSize: 100,
      lineHeight: 5,
      textAlign: "middle" as unknown as TextAlign,
      viewMode: "sideways" as unknown as ViewMode,
      defaultLibraryView: "gallery" as unknown as LibraryView,
      margins: { top: -10, left: 500, right: 10, bottom: 10 },
      customTheme: undefined,
    };

    storage.getSettings.mockResolvedValueOnce(stored as Settings);

    const settings = await service.loadSettings();

    expect(settings.fontSize).toBeLessThanOrEqual(48);
    expect(settings.lineHeight).toBeLessThanOrEqual(3);
    expect(settings.textAlign).toBe(DEFAULT_SETTINGS.textAlign);
    expect(settings.viewMode).toBe(DEFAULT_SETTINGS.viewMode);
    expect(settings.defaultLibraryView).toBe(DEFAULT_SETTINGS.defaultLibraryView);
    expect(settings.margins.top).toBeGreaterThanOrEqual(0);
    expect(settings.margins.left).toBeLessThanOrEqual(200);
  });

  it("merges and saves updates", async () => {
    storage.getSettings.mockResolvedValueOnce(null);

    const updated = await service.updateSettings({
      theme: Theme.DARK,
      fontSize: 18,
      margins: { top: 40 },
    });

    expect(updated.theme).toBe(Theme.DARK);
    expect(updated.fontSize).toBe(18);
    expect(updated.margins.top).toBe(40);
    expect(storage.saveSettings).toHaveBeenCalledWith(updated);
  });

  it("resets to defaults", async () => {
    const result = await service.reset();
    expect(result).toEqual(DEFAULT_SETTINGS);
    expect(storage.saveSettings).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it("applies settings to EPUB service", async () => {
    storage.getSettings.mockResolvedValueOnce({
      ...DEFAULT_SETTINGS,
      viewMode: ViewMode.CONTINUOUS,
      theme: Theme.SEPIA,
      fontFamily: "Georgia",
      margins: { top: 20, right: 25, bottom: 20, left: 25 },
    });

    const result = await service.applyToEPUB(new EPUBService(), { forceReload: true });

    expect(epubServiceMock.setViewMode).toHaveBeenCalledWith(ViewMode.CONTINUOUS);
    expect(epubServiceMock.applyTheme).toHaveBeenCalled();
    expect(result.theme).toBe(Theme.SEPIA);
  });
});
