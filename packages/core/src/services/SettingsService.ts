import { DEFAULT_SETTINGS, Settings } from "../models/Settings";
import { Theme } from "../models/Theme";
import { ViewMode } from "../models/ViewMode";
import { TextAlign } from "../models/TextAlign";
import { LibraryView } from "../models/LibraryView";
import { IStorageAdapter } from "../interfaces/IStorageAdapter";
import { EPUBService, RenditionThemeStyles } from "./EPUBService";

export interface SettingsUpdate {
  theme?: Settings["theme"];
  customTheme?: Settings["customTheme"] | null;
  fontFamily?: Settings["fontFamily"];
  fontSize?: Settings["fontSize"];
  lineHeight?: Settings["lineHeight"];
  letterSpacing?: Settings["letterSpacing"];
  textAlign?: Settings["textAlign"];
  paragraphSpacing?: Settings["paragraphSpacing"];
  overrideBookStyles?: Settings["overrideBookStyles"];
  viewMode?: Settings["viewMode"];
  pageWidth?: Settings["pageWidth"];
  margins?: Partial<Settings["margins"]>;
  maxContentWidth?: Settings["maxContentWidth"];
  autoSaveInterval?: Settings["autoSaveInterval"];
  gesturesEnabled?: Settings["gesturesEnabled"];
  animationsEnabled?: Settings["animationsEnabled"];
  defaultLibraryView?: Settings["defaultLibraryView"];
  sidebarPosition?: Settings["sidebarPosition"];
  enableTelemetry?: Settings["enableTelemetry"];
}

interface SettingsApplyOptions {
  settings?: Settings;
  forceReload?: boolean;
}

type ThemePalette = {
  background: string;
  text: string;
  link: string;
  highlight: string;
};

const THEME_PALETTES: Record<Theme, ThemePalette> = {
  [Theme.LIGHT]: {
    background: "#ffffff",
    text: "#0f172a",
    link: "#2563eb",
    highlight: "#fde68a",
  },
  [Theme.DARK]: {
    background: "#0f172a",
    text: "#e2e8f0",
    link: "#60a5fa",
    highlight: "#1e293b",
  },
  [Theme.SEPIA]: {
    background: "#f4ecd8",
    text: "#5b4636",
    link: "#b45309",
    highlight: "#f59e0b",
  },
  [Theme.BLACK]: {
    background: "#000000",
    text: "#f9fafb",
    link: "#93c5fd",
    highlight: "#1f2937",
  },
  [Theme.CUSTOM]: {
    background: "#ffffff",
    text: "#0f172a",
    link: "#2563eb",
    highlight: "#fde68a",
  },
};

export class SettingsService {
  private cachedSettings: Settings | null = null;

  constructor(private readonly storage: IStorageAdapter) {}

  async loadSettings(forceReload = false): Promise<Settings> {
    if (this.cachedSettings && !forceReload) {
      return this.cachedSettings;
    }

    const stored = await this.storage.getSettings();
    const merged = this.normalizeSettings(stored ?? DEFAULT_SETTINGS);
    this.cachedSettings = merged;
    return merged;
  }

  async getSettings(): Promise<Settings> {
    return this.loadSettings();
  }

  async updateSettings(update: SettingsUpdate): Promise<Settings> {
    const current = await this.loadSettings();
    const next: Settings = this.normalizeSettings({
      ...current,
      ...update,
      customTheme: update.customTheme === null ? undefined : update.customTheme ?? current.customTheme,
      margins: {
        ...current.margins,
        ...update.margins,
      },
    });

    await this.storage.saveSettings(next);
    this.cachedSettings = next;
    return next;
  }

  async reset(): Promise<Settings> {
    const defaults = this.normalizeSettings(DEFAULT_SETTINGS);
    await this.storage.saveSettings(defaults);
    this.cachedSettings = defaults;
    return defaults;
  }

  async applyToEPUB(
    service: EPUBService,
    options: SettingsApplyOptions = {}
  ): Promise<Settings> {
    const settings = options.settings
      ? this.normalizeSettings(options.settings)
      : await this.loadSettings(options.forceReload ?? false);

    service.setViewMode(settings.viewMode);
    service.applyTheme(settings.theme, this.createThemeStyles(settings));

    return settings;
  }

  private normalizeSettings(settings: Settings): Settings {
    const sanitized: Settings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      theme: this.normalizeTheme(settings.theme),
      viewMode: this.normalizeViewMode(settings.viewMode),
      textAlign: this.normalizeTextAlign(settings.textAlign),
      defaultLibraryView: this.normalizeLibraryView(settings.defaultLibraryView),
      customTheme: settings.customTheme ?? undefined,
      margins: {
        ...DEFAULT_SETTINGS.margins,
        ...settings.margins,
      },
      sidebarPosition: settings.sidebarPosition === "right" ? "right" : "left",
      enableTelemetry: Boolean(settings.enableTelemetry),
      gesturesEnabled: Boolean(settings.gesturesEnabled),
      animationsEnabled: Boolean(settings.animationsEnabled),
      overrideBookStyles: Boolean(settings.overrideBookStyles),
    };

    sanitized.fontSize = this.clampNumber(sanitized.fontSize, 8, 48, DEFAULT_SETTINGS.fontSize);
    sanitized.lineHeight = this.clampNumber(sanitized.lineHeight, 1, 3, DEFAULT_SETTINGS.lineHeight);
    sanitized.letterSpacing = this.clampNumber(sanitized.letterSpacing, -1, 5, DEFAULT_SETTINGS.letterSpacing);
    sanitized.paragraphSpacing = this.clampNumber(sanitized.paragraphSpacing, 0, 8, DEFAULT_SETTINGS.paragraphSpacing);
    sanitized.pageWidth = this.clampNumber(sanitized.pageWidth, 360, 1440, DEFAULT_SETTINGS.pageWidth);
    sanitized.maxContentWidth = this.clampNumber(sanitized.maxContentWidth, 480, 1920, DEFAULT_SETTINGS.maxContentWidth);
    sanitized.autoSaveInterval = Math.floor(
      this.clampNumber(sanitized.autoSaveInterval, 5, 600, DEFAULT_SETTINGS.autoSaveInterval)
    );

    sanitized.margins = {
      top: this.clampNumber(sanitized.margins.top, 0, 200, DEFAULT_SETTINGS.margins.top),
      right: this.clampNumber(sanitized.margins.right, 0, 200, DEFAULT_SETTINGS.margins.right),
      bottom: this.clampNumber(sanitized.margins.bottom, 0, 200, DEFAULT_SETTINGS.margins.bottom),
      left: this.clampNumber(sanitized.margins.left, 0, 200, DEFAULT_SETTINGS.margins.left),
    };

    if (sanitized.maxContentWidth < sanitized.pageWidth) {
      sanitized.maxContentWidth = sanitized.pageWidth;
    }

    if (!sanitized.fontFamily?.trim()) {
      sanitized.fontFamily = DEFAULT_SETTINGS.fontFamily;
    }

    return sanitized;
  }

  private clampNumber(
    value: number | undefined,
    min: number,
    max: number,
    fallback: number
  ): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  private normalizeTheme(theme: Theme | undefined): Theme {
    if (!theme) {
      return DEFAULT_SETTINGS.theme;
    }
    return Object.values(Theme).includes(theme) ? theme : DEFAULT_SETTINGS.theme;
  }

  private normalizeViewMode(viewMode: ViewMode | undefined): ViewMode {
    if (!viewMode) {
      return DEFAULT_SETTINGS.viewMode;
    }
    return Object.values(ViewMode).includes(viewMode) ? viewMode : DEFAULT_SETTINGS.viewMode;
  }

  private normalizeTextAlign(textAlign: TextAlign | undefined): TextAlign {
    if (!textAlign) {
      return DEFAULT_SETTINGS.textAlign;
    }
    return Object.values(TextAlign).includes(textAlign) ? textAlign : DEFAULT_SETTINGS.textAlign;
  }

  private normalizeLibraryView(view: LibraryView | undefined): LibraryView {
    if (!view) {
      return DEFAULT_SETTINGS.defaultLibraryView;
    }
    return Object.values(LibraryView).includes(view)
      ? view
      : DEFAULT_SETTINGS.defaultLibraryView;
  }

  private createThemeStyles(settings: Settings): RenditionThemeStyles {
    const palette = this.resolvePalette(settings);

    const bodyStyles: Record<string, string> = {
      "background-color": palette.background,
      color: palette.text,
      "font-family": settings.fontFamily,
      "font-size": `${settings.fontSize}px`,
      "line-height": settings.lineHeight.toString(),
      "letter-spacing": `${settings.letterSpacing}px`,
      "text-align": settings.textAlign,
      "max-width": `${settings.maxContentWidth}px`,
      margin: "0 auto",
      padding: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px`,
      "-webkit-hyphens": settings.overrideBookStyles ? "auto" : "inherit",
      hyphens: settings.overrideBookStyles ? "auto" : "inherit",
    };

    if (settings.pageWidth) {
      bodyStyles["column-width"] = `${settings.pageWidth}px`;
    }

    const styles: RenditionThemeStyles = {
      body: bodyStyles,
      a: {
        color: palette.link,
      },
      p: {
        "margin-bottom": `${settings.paragraphSpacing}em`,
      },
      "::selection": {
        "background-color": palette.highlight,
        color: palette.text,
      },
    };

    return styles;
  }

  private resolvePalette(settings: Settings): ThemePalette {
    if (settings.theme === Theme.CUSTOM && settings.customTheme) {
      return {
        background: settings.customTheme.backgroundColor,
        text: settings.customTheme.textColor,
        link: settings.customTheme.linkColor,
        highlight: settings.customTheme.highlightColor,
      };
    }

    return THEME_PALETTES[settings.theme] ?? THEME_PALETTES[Theme.LIGHT];
  }
}
