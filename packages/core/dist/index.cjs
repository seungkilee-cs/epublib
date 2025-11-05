"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AnnotationType: () => AnnotationType,
  BookService: () => BookService,
  BookStatus: () => BookStatus,
  EPUBService: () => EPUBService,
  HighlightColor: () => HighlightColor,
  LibraryView: () => LibraryView,
  ProgressService: () => ProgressService,
  TextAlign: () => TextAlign,
  Theme: () => Theme,
  ViewMode: () => ViewMode
});
module.exports = __toCommonJS(index_exports);

// src/models/AnnotationType.ts
var AnnotationType = /* @__PURE__ */ ((AnnotationType2) => {
  AnnotationType2["BOOKMARK"] = "bookmark";
  AnnotationType2["HIGHLIGHT"] = "highlight";
  AnnotationType2["NOTE"] = "note";
  return AnnotationType2;
})(AnnotationType || {});

// src/models/BookStatus.ts
var BookStatus = /* @__PURE__ */ ((BookStatus2) => {
  BookStatus2["NOT_STARTED"] = "not_started";
  BookStatus2["READING"] = "reading";
  BookStatus2["COMPLETED"] = "completed";
  return BookStatus2;
})(BookStatus || {});

// src/models/HighlightColor.ts
var HighlightColor = /* @__PURE__ */ ((HighlightColor2) => {
  HighlightColor2["YELLOW"] = "yellow";
  HighlightColor2["GREEN"] = "green";
  HighlightColor2["BLUE"] = "blue";
  HighlightColor2["PINK"] = "pink";
  HighlightColor2["PURPLE"] = "purple";
  return HighlightColor2;
})(HighlightColor || {});

// src/models/LibraryView.ts
var LibraryView = /* @__PURE__ */ ((LibraryView2) => {
  LibraryView2["GRID"] = "grid";
  LibraryView2["LIST"] = "list";
  LibraryView2["COMPACT"] = "compact";
  return LibraryView2;
})(LibraryView || {});

// src/models/TextAlign.ts
var TextAlign = /* @__PURE__ */ ((TextAlign2) => {
  TextAlign2["LEFT"] = "left";
  TextAlign2["JUSTIFY"] = "justify";
  TextAlign2["RIGHT"] = "right";
  TextAlign2["CENTER"] = "center";
  return TextAlign2;
})(TextAlign || {});

// src/models/Theme.ts
var Theme = /* @__PURE__ */ ((Theme2) => {
  Theme2["LIGHT"] = "light";
  Theme2["DARK"] = "dark";
  Theme2["SEPIA"] = "sepia";
  Theme2["BLACK"] = "black";
  Theme2["CUSTOM"] = "custom";
  return Theme2;
})(Theme || {});

// src/models/ViewMode.ts
var ViewMode = /* @__PURE__ */ ((ViewMode2) => {
  ViewMode2["PAGINATED"] = "paginated";
  ViewMode2["CONTINUOUS"] = "continuous";
  ViewMode2["SINGLE_PAGE"] = "single";
  ViewMode2["TWO_PAGE"] = "double";
  return ViewMode2;
})(ViewMode || {});

// src/services/EPUBService.ts
var import_epubjs = __toESM(require("epubjs"), 1);
var EPUBService = class {
  constructor() {
    this.book = null;
    this.rendition = null;
    this.currentLocation = null;
  }
  isLoaded() {
    return Boolean(this.book);
  }
  async loadBook(data) {
    try {
      this.book = (0, import_epubjs.default)(data);
      await this.book.ready;
    } catch (error) {
      this.book = null;
      throw new Error(`Failed to load EPUB: ${error.message}`);
    }
  }
  async renderTo(element, options = {}) {
    const book = this.ensureBook();
    try {
      this.rendition = book.renderTo(element, {
        width: "100%",
        height: "100%",
        flow: options.flow ?? "paginated"
      });
    } catch (error) {
      this.rendition = null;
      throw new Error(`Failed to render EPUB: ${error.message}`);
    }
    if (options.restoreLocation) {
      await this.safeDisplay(options.restoreLocation);
    } else {
      await this.safeDisplay();
    }
    this.rendition.on("relocated", (location) => {
      this.currentLocation = this.mapLocation(location);
    });
  }
  async destroy() {
    try {
      await this.rendition?.destroy();
    } finally {
      this.book = null;
      this.rendition = null;
      this.currentLocation = null;
    }
  }
  getRendition() {
    return this.rendition;
  }
  getBook() {
    return this.book;
  }
  getCurrentLocation() {
    return this.currentLocation;
  }
  async nextPage() {
    const rendition = this.ensureRendition();
    await rendition.next();
  }
  async prevPage() {
    const rendition = this.ensureRendition();
    await rendition.prev();
  }
  async goTo(cfi) {
    await this.safeDisplay(cfi);
  }
  async goToHref(href) {
    await this.safeDisplay(href);
  }
  async getToc() {
    const book = this.ensureBook();
    const navigation = await book.loaded.navigation;
    return navigation.toc.map((item) => this.mapToc(item));
  }
  mapLocation(location) {
    return {
      cfi: location?.start?.cfi ?? "",
      percentage: location?.start?.percentage ?? 0,
      page: location?.start?.displayed?.page ?? 0,
      totalPages: location?.start?.displayed?.total ?? 0,
      chapter: location?.start?.href,
      chapterHref: location?.start?.href
    };
  }
  mapToc(item) {
    const children = item.subitems?.length ? item.subitems.map((subItem) => this.mapToc(subItem)) : void 0;
    return {
      id: item.id ?? item.href ?? "",
      label: item.label ?? item.href ?? "",
      href: item.href ?? "",
      subitems: children
    };
  }
  applyTheme(theme, styles) {
    const rendition = this.rendition;
    if (!rendition) {
      return;
    }
    rendition.themes.register(theme, styles);
    rendition.themes.select(theme);
  }
  setViewMode(viewMode) {
    const rendition = this.rendition;
    if (!rendition) {
      return;
    }
    const flow = viewMode === "continuous" /* CONTINUOUS */ ? "scrolled" : "paginated";
    rendition.flow(flow);
  }
  on(eventName, callback) {
    this.rendition?.on(eventName, callback);
  }
  off(eventName, callback) {
    this.rendition?.off(eventName, callback);
  }
  ensureBook() {
    if (!this.book) {
      throw new Error("EPUB book is not loaded");
    }
    return this.book;
  }
  ensureRendition() {
    if (!this.rendition) {
      throw new Error("EPUB rendition is not initialized");
    }
    return this.rendition;
  }
  async safeDisplay(target) {
    const rendition = this.ensureRendition();
    try {
      await rendition.display(target);
    } catch (error) {
      throw new Error(`Failed to display location: ${error.message}`);
    }
  }
};

// src/services/BookService.ts
var import_uuid = require("uuid");
var BookService = class {
  constructor(storage, fileAdapter) {
    this.storage = storage;
    this.fileAdapter = fileAdapter;
  }
  async addBook(file, metadata = {}, options = {}) {
    const mergedMetadata = options.extractMetadata ? await this.extractMetadata(file, metadata) : metadata;
    const book = {
      id: mergedMetadata.id ?? (0, import_uuid.v4)(),
      title: mergedMetadata.title ?? "Untitled Book",
      author: mergedMetadata.author ?? "Unknown Author",
      fileSize: mergedMetadata.fileSize ?? file.byteLength,
      dateAdded: mergedMetadata.dateAdded ?? /* @__PURE__ */ new Date(),
      status: mergedMetadata.status ?? "not_started" /* NOT_STARTED */,
      ...mergedMetadata
    };
    if (options.createPlaceholderCover && !book.coverUrl) {
      book.coverUrl = this.createPlaceholderCover(book.title);
    }
    return this.storage.saveBook(book, file);
  }
  async updateBook(id, updates) {
    const existing = await this.storage.getBook(id);
    if (!existing) {
      throw new Error(`Book with id ${id} not found`);
    }
    await this.storage.updateBook(id, updates);
  }
  async deleteBook(id) {
    await this.storage.deleteBook(id);
    await this.storage.deleteAnnotationsByBook(id);
    await this.storage.deleteProgress(id);
  }
  async getBook(id) {
    return this.storage.getBook(id);
  }
  async getAllBooks() {
    return this.storage.getAllBooks();
  }
  async searchBooks(query) {
    return this.storage.searchBooks(query);
  }
  async getAnnotations(bookId) {
    return this.storage.getAnnotations(bookId);
  }
  async getProgress(bookId) {
    return this.storage.getProgress(bookId);
  }
  async extractMetadata(_file, fallback) {
    return fallback;
  }
  createPlaceholderCover(title) {
    const initials = title.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 3).join("");
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%' height='100%' fill='%230069ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='white'>${initials || "EPUB"}</text></svg>`;
  }
};

// src/services/ProgressService.ts
var ProgressService = class {
  constructor(storage) {
    this.storage = storage;
    this.activeSessions = /* @__PURE__ */ new Map();
  }
  async updateProgress(bookId, location, options = {}) {
    if (!location.cfi) {
      throw new Error("Invalid location: missing CFI");
    }
    const progress = {
      bookId,
      cfi: location.cfi,
      percentage: Math.min(Math.max(location.percentage, 0), 1) * 100,
      currentPage: location.page,
      totalPages: options.totalPages ?? location.totalPages,
      currentChapter: location.chapter,
      chapterIndex: void 0,
      lastUpdated: /* @__PURE__ */ new Date(),
      readingTime: options.sessionStartTime ? this.calculateSecondsBetween(/* @__PURE__ */ new Date(), options.sessionStartTime) : 0,
      sessionStartTime: options.sessionStartTime
    };
    await this.storage.saveProgress(bookId, progress);
    return progress;
  }
  async getProgress(bookId) {
    return this.storage.getProgress(bookId);
  }
  async startSession(bookId) {
    this.activeSessions.set(bookId, /* @__PURE__ */ new Date());
  }
  async endSession(bookId, pagesRead) {
    const start = this.activeSessions.get(bookId);
    if (!start) {
      return null;
    }
    const end = /* @__PURE__ */ new Date();
    const session = {
      bookId,
      startTime: start,
      endTime: end,
      pagesRead,
      duration: this.calculateSecondsBetween(end, start)
    };
    await this.storage.saveSession(session);
    this.activeSessions.delete(bookId);
    return session;
  }
  async getStatistics(dateFrom, dateTo) {
    const sessions = await this.storage.getSessions(void 0, dateFrom, dateTo);
    const progressList = await this.storage.getAllProgress();
    const totalReadingTime = sessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );
    const booksCompleted = progressList.filter(
      (progress) => progress.percentage >= 100
    ).length;
    const booksRead = new Set(sessions.map((session) => session.bookId)).size;
    const streaks = this.calculateStreaks(sessions);
    const averagePagesPerDay = this.calculateAveragePagesPerDay(sessions);
    return {
      totalReadingTime,
      booksInProgress: progressList.length - booksCompleted,
      booksCompleted,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      averagePagesPerDay,
      averageReadingSpeed: this.calculateAverageSpeed(sessions),
      booksRead,
      dailyGoal: void 0,
      weeklyGoal: void 0,
      readingHistory: sessions
    };
  }
  async getBookStatistics(bookId) {
    const sessions = await this.storage.getSessions(bookId);
    const progress = await this.storage.getProgress(bookId);
    const totalReadingTime = sessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );
    const pagesRead = sessions.reduce(
      (acc, session) => acc + session.pagesRead,
      0
    );
    return {
      bookId,
      totalReadingTime,
      lastReadAt: sessions.at(-1)?.endTime,
      pagesRead,
      annotationsCount: (await this.storage.getAnnotations(bookId)).length
    };
  }
  calculateAveragePagesPerDay(sessions) {
    const pagesByDate = /* @__PURE__ */ new Map();
    sessions.forEach((session) => {
      const dateKey = session.startTime.toISOString().split("T")[0];
      const total = pagesByDate.get(dateKey) ?? 0;
      pagesByDate.set(dateKey, total + session.pagesRead);
    });
    if (pagesByDate.size === 0) {
      return 0;
    }
    const totalPages = Array.from(pagesByDate.values()).reduce(
      (acc, pages) => acc + pages,
      0
    );
    return totalPages / pagesByDate.size;
  }
  calculateAverageSpeed(sessions) {
    const totalPages = sessions.reduce((acc, session) => acc + session.pagesRead, 0);
    const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
    if (totalDuration === 0) {
      return 0;
    }
    return totalPages / totalDuration * 3600;
  }
  calculateStreaks(sessions) {
    if (sessions.length === 0) {
      return { current: 0, longest: 0 };
    }
    const days = Array.from(
      new Set(
        sessions.map((session) => session.startTime.toISOString().split("T")[0])
      )
    ).map((iso) => new Date(iso)).sort((a, b) => a.getTime() - b.getTime());
    let currentStreak = 1;
    let longestStreak = 1;
    for (let i = 1; i < days.length; i += 1) {
      const prev = days[i - 1];
      const current = days[i];
      const diff = this.calculateSecondsBetween(current, prev) / 86400;
      if (diff === 1) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }
    const today = /* @__PURE__ */ new Date();
    const lastDay = days[days.length - 1];
    if (!lastDay || !this.isSameDay(today, lastDay)) {
      currentStreak = 0;
    }
    return { current: currentStreak, longest: longestStreak };
  }
  calculateSecondsBetween(a, b) {
    return Math.floor((a.getTime() - b.getTime()) / 1e3);
  }
  isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnnotationType,
  BookService,
  BookStatus,
  EPUBService,
  HighlightColor,
  LibraryView,
  ProgressService,
  TextAlign,
  Theme,
  ViewMode
});
