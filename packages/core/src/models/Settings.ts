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
