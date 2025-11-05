import * as react_jsx_runtime from 'react/jsx-runtime';
import { PropsWithChildren, CSSProperties, ButtonHTMLAttributes } from 'react';
import { EPUBService, EPUBServiceOptions, LocationInfo } from '@epub-reader/core';

declare const colors: {
    readonly background: "#fdfdfd";
    readonly surface: "#ffffff";
    readonly primary: "#2563eb";
    readonly primaryHover: "#1d4ed8";
    readonly text: "#111827";
    readonly textMuted: "#6b7280";
    readonly border: "#e5e7eb";
    readonly overlay: "rgba(15, 23, 42, 0.6)";
};
declare const spacing: {
    readonly xs: "0.25rem";
    readonly sm: "0.5rem";
    readonly md: "1rem";
    readonly lg: "1.5rem";
    readonly xl: "2rem";
};
declare const radii: {
    readonly sm: "0.25rem";
    readonly md: "0.5rem";
    readonly lg: "0.75rem";
    readonly round: "9999px";
};
declare const typography: {
    readonly fontFamily: "'Inter', system-ui";
    readonly fontSize: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly md: "1rem";
        readonly lg: "1.25rem";
        readonly xl: "1.5rem";
    };
    readonly lineHeight: {
        readonly tight: 1.25;
        readonly snug: 1.375;
        readonly normal: 1.5;
        readonly relaxed: 1.625;
    };
};
declare const shadows: {
    readonly sm: "0 1px 2px 0 rgba(15, 23, 42, 0.08)";
    readonly md: "0 4px 12px rgba(15, 23, 42, 0.12)";
};
declare const baseTheme: {
    readonly colors: {
        readonly background: "#fdfdfd";
        readonly surface: "#ffffff";
        readonly primary: "#2563eb";
        readonly primaryHover: "#1d4ed8";
        readonly text: "#111827";
        readonly textMuted: "#6b7280";
        readonly border: "#e5e7eb";
        readonly overlay: "rgba(15, 23, 42, 0.6)";
    };
    readonly spacing: {
        readonly xs: "0.25rem";
        readonly sm: "0.5rem";
        readonly md: "1rem";
        readonly lg: "1.5rem";
        readonly xl: "2rem";
    };
    readonly radii: {
        readonly sm: "0.25rem";
        readonly md: "0.5rem";
        readonly lg: "0.75rem";
        readonly round: "9999px";
    };
    readonly typography: {
        readonly fontFamily: "'Inter', system-ui";
        readonly fontSize: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly md: "1rem";
            readonly lg: "1.25rem";
            readonly xl: "1.5rem";
        };
        readonly lineHeight: {
            readonly tight: 1.25;
            readonly snug: 1.375;
            readonly normal: 1.5;
            readonly relaxed: 1.625;
        };
    };
    readonly shadows: {
        readonly sm: "0 1px 2px 0 rgba(15, 23, 42, 0.08)";
        readonly md: "0 4px 12px rgba(15, 23, 42, 0.12)";
    };
};
type ReaderTheme = typeof baseTheme;

type ThemeOverrides = Partial<{
    colors: Partial<ReaderTheme["colors"]>;
    spacing: Partial<ReaderTheme["spacing"]>;
    radii: Partial<ReaderTheme["radii"]>;
    typography: Partial<ReaderTheme["typography"]> & {
        fontSize?: Partial<ReaderTheme["typography"]["fontSize"]>;
        lineHeight?: Partial<ReaderTheme["typography"]["lineHeight"]>;
    };
    shadows: Partial<ReaderTheme["shadows"]>;
}>;

type ThemeProviderProps = PropsWithChildren<{
    theme?: ThemeOverrides;
    className?: string;
    style?: CSSProperties;
}>;
declare function ThemeProvider({ theme, children, className, style, }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
declare function useTheme(): ReaderTheme;

type ControlButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;
type NavigationControlsProps = {
    onNext: () => void;
    onPrev: () => void;
    disableNext?: boolean;
    disablePrev?: boolean;
    className?: string;
    nextButtonProps?: ControlButtonProps;
    prevButtonProps?: ControlButtonProps;
    nextLabel?: string;
    prevLabel?: string;
};
declare function NavigationControls({ onNext, onPrev, disableNext, disablePrev, className, nextButtonProps, prevButtonProps, nextLabel, prevLabel, }: NavigationControlsProps): react_jsx_runtime.JSX.Element;

type ReaderViewStatus = {
    location: LocationInfo | null;
    isLoading: boolean;
    error: string | null;
};
type BookBinarySource = ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
type ControlsOverrides = Partial<Omit<NavigationControlsProps, "onNext" | "onPrev" | "disableNext" | "disablePrev">>;
type ReaderViewProps = {
    service: EPUBService;
    bookData: BookBinarySource;
    className?: string;
    style?: CSSProperties;
    flow?: EPUBServiceOptions["flow"];
    initialLocation?: string;
    onLocationChange?: (location: LocationInfo) => void;
    onReady?: () => void;
    onError?: (error: Error) => void;
    statusFormatter?: (status: ReaderViewStatus) => string | null;
    controlsOverrides?: ControlsOverrides;
    enableKeyboardShortcuts?: boolean;
    enableTouchGestures?: boolean;
};
declare function ReaderView({ service, bookData, className, style, flow, initialLocation, onLocationChange, onReady, onError, statusFormatter, controlsOverrides, enableKeyboardShortcuts, enableTouchGestures, }: ReaderViewProps): react_jsx_runtime.JSX.Element;

export { NavigationControls, type NavigationControlsProps, type ReaderTheme, ReaderView, type ReaderViewProps, type ReaderViewStatus, type ThemeOverrides, ThemeProvider, baseTheme, colors, radii, shadows, spacing, typography, useTheme };
