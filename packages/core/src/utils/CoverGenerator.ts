import { Book } from "../models/Book";

export interface PlaceholderCoverOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: number;
}

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 480;
const DEFAULT_FONT_FAMILY = "'Inter', 'Segoe UI', Arial, sans-serif";
const COLOR_PALETTE = [
  { background: "#1d4ed8", accent: "#60a5fa" },
  { background: "#0f766e", accent: "#2dd4bf" },
  { background: "#7c3aed", accent: "#a855f7" },
  { background: "#be123c", accent: "#f97316" },
  { background: "#0f172a", accent: "#1d4ed8" },
  { background: "#ca8a04", accent: "#facc15" },
];

export class CoverGenerator {
  static generatePlaceholder(
    title: string,
    options: PlaceholderCoverOptions = {}
  ): string {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    const borderRadius = Math.max(0, Math.min(options.borderRadius ?? 24, Math.min(width, height) / 2));

    const cleanedTitle = this.cleanText(title) ?? "Untitled";
    const initials = this.extractInitials(cleanedTitle);
    const paletteIndex = this.hashString(cleanedTitle) % COLOR_PALETTE.length;
    const palette = COLOR_PALETTE[paletteIndex];

    const background = options.backgroundColor ?? palette.background;
    const accent = options.accentColor ?? palette.accent;
    const textColor = options.textColor ?? "#ffffff";
    const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;

    const gradientId = `g-${this.hashString(background + accent + textColor + initials)}`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${background}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" fill="url(#${gradientId})" />
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="${fontFamily}"
    font-size="${Math.round(height * 0.22)}"
    font-weight="600"
    fill="${textColor}"
    letter-spacing="${initials.length > 1 ? 8 : 0}"
  >${this.escapeXml(initials)}</text>
</svg>`;

    return `data:image/svg+xml;base64,${this.encodeBase64(svg)}`;
  }

  static async generateThumbnail(
    coverUrl: string,
    width: number,
    height: number,
    background = "#ffffff"
  ): Promise<string | null> {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }
    try {
      const image = await this.loadImage(coverUrl);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        return null;
      }

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const aspectRatio = image.width / image.height;
      let drawWidth = width;
      let drawHeight = Math.round(width / aspectRatio);
      if (drawHeight > height) {
        drawHeight = height;
        drawWidth = Math.round(height * aspectRatio);
      }

      const offsetX = Math.round((width - drawWidth) / 2);
      const offsetY = Math.round((height - drawHeight) / 2);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.warn("CoverGenerator: failed to generate thumbnail", error);
      return null;
    }
  }

  static extractInitials(title: string, max = 3): string {
    const cleaned = this.cleanText(title);
    if (!cleaned) {
      return "EPUB";
    }

    const words = cleaned
      .split(/\s+/u)
      .map((word) => word.trim())
      .filter(Boolean);

    if (!words.length) {
      return "EPUB";
    }

    const initials = words
      .slice(0, max)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase();

    return initials.length ? initials : "EPUB";
  }

  static pickPaletteForBook(book: Pick<Book, "title" | "author">): { background: string; accent: string } {
    const seed = `${book.title ?? ""}-${book.author ?? ""}`;
    const paletteIndex = this.hashString(seed || "default") % COLOR_PALETTE.length;
    return COLOR_PALETTE[paletteIndex];
  }

  private static cleanText(value?: string): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.replace(/\s+/gu, " ").trim();
    return trimmed.length ? trimmed : undefined;
  }

  private static hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private static escapeXml(value: string): string {
    return value.replace(/[&<>'"]/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return char;
      }
    });
  }

  private static encodeBase64(value: string): string {
    if (typeof globalThis.btoa === "function") {
      return globalThis.btoa(value);
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(value, "utf-8").toString("base64");
    }

    throw new Error("Base64 encoding is not supported in this environment");
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      return Promise.reject(new Error("Image loading is not supported in this environment"));
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = (event) => reject(event);
      image.src = src;
    });
  }
}
