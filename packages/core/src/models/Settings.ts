import { Theme } from "./Theme";
import { ViewMode } from "./ViewMode";
import { TextAlign } from "./TextAlign";
import { LibraryView } from "./LibraryView";

export interface CustomTheme {
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  highlightColor: string;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Settings {
  theme: Theme;
  customTheme?: CustomTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: TextAlign;
  paragraphSpacing: number;
  overrideBookStyles: boolean;
  viewMode: ViewMode;
  spreadMode: ViewMode;
  defaultPageSpread: "auto" | "single" | "double";
  pageWidth: number;
  margins: Margins;
  maxContentWidth: number;
  autoSaveInterval: number;
  gesturesEnabled: boolean;
  animationsEnabled: boolean;
  defaultLibraryView: LibraryView;
  sidebarPosition: "left" | "right";
  enableTelemetry: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: Theme.LIGHT,
  fontFamily: "'Inter', system-ui",
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: TextAlign.JUSTIFY,
  paragraphSpacing: 1.2,
  overrideBookStyles: false,
  viewMode: ViewMode.PAGINATED,
  spreadMode: ViewMode.SINGLE_PAGE,
  defaultPageSpread: "auto",
  pageWidth: 720,
  margins: {
    top: 32,
    right: 48,
    bottom: 32,
    left: 48,
  },
  maxContentWidth: 960,
  autoSaveInterval: 30,
  gesturesEnabled: true,
  animationsEnabled: true,
  defaultLibraryView: LibraryView.GRID,
  sidebarPosition: "left",
  enableTelemetry: false,
};
