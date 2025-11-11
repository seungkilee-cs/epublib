import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import type { TocItem } from "@epub-reader/core";
import styles from "./TableOfContents.module.css";

export type TableOfContentsProps = {
  toc?: TocItem[] | null;
  currentChapterHref?: string | null;
  onNavigate?: (href: string) => void;
  className?: string;
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
};

type TocTreeItem = TocItem & { subitems?: TocItem[] };

type TocDepthStyle = CSSProperties & {
  "--toc-depth"?: number;
};

type NormalizedHref = {
  full: string;
  path: string;
};

function normalizeHref(rawHref?: string | null): NormalizedHref {
  if (!rawHref) {
    return { full: "", path: "" };
  }

  const trimmed = decodeURIComponent(rawHref).trim();
  const withoutLeadingSlash = trimmed.replace(/^\/+/, "");
  const [pathPart, hashPart] = withoutLeadingSlash.split("#");
  const path = pathPart ?? "";
  const full = hashPart ? `${path}#${hashPart}` : path;
  return { full, path };
}

function resolveActivePath(items: TocTreeItem[] | null | undefined, activeHref: NormalizedHref) {
  const activePath = new Set<string>();
  let activeId: string | null = null;

  const visit = (nodes: TocTreeItem[] | undefined): boolean => {
    if (!nodes?.length) {
      return false;
    }
    let containsActive = false;

    for (const node of nodes) {
      const normalizedItem = normalizeHref(node.href);
      const isDirectActive =
        normalizedItem.full === activeHref.full || normalizedItem.path === activeHref.path;

      const childContainsActive = visit(node.subitems);
      if (isDirectActive) {
        activeId = node.id;
      }

      if (isDirectActive || childContainsActive) {
        activePath.add(node.id);
        containsActive = true;
      }
    }

    return containsActive;
  };

  visit(items ?? undefined);
  return { activeId, activePath };
}

export function TableOfContents({
  toc,
  currentChapterHref,
  onNavigate,
  className,
  title = "Contents",
  emptyMessage = "No table of contents available",
  isLoading = false,
}: TableOfContentsProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCollapsedIds(new Set());
  }, [toc]);

  const normalizedActive = useMemo(() => normalizeHref(currentChapterHref), [currentChapterHref]);

  const { activeId, activePath } = useMemo(
    () => resolveActivePath(toc ?? null, normalizedActive),
    [toc, normalizedActive]
  );

  useEffect(() => {
    if (!activePath.size) {
      return;
    }

    setCollapsedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of activePath) {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activePath]);

  const toggleSection = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      if (!href) {
        return;
      }
      onNavigate?.(href);
    },
    [onNavigate]
  );

  const renderItems = useCallback(
    (items: TocTreeItem[] | undefined, depth: number) => {
      if (!items?.length) {
        return null;
      }

      return (
        <ul className={styles.list}>
          {items.map((item) => {
            const hasChildren = Boolean(item.subitems?.length);
            const collapsed = hasChildren && collapsedIds.has(item.id);
            const isActive = activeId === item.id;
            const isActiveBranch = activePath.has(item.id);

            const depthStyle: TocDepthStyle = {
              "--toc-depth": depth,
            };

            return (
              <li key={item.id || item.href} className={styles.item}>
                <div
                  className={styles.itemRow}
                  data-active={isActive || undefined}
                  style={depthStyle}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className={styles.toggleButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSection(item.id);
                      }}
                      aria-label={`${collapsed ? "Expand" : "Collapse"} section`}
                      aria-expanded={!collapsed}
                    >
                      <span className={styles.toggleGlyph}>{collapsed ? "▸" : "▾"}</span>
                    </button>
                  ) : (
                    <span className={styles.togglePlaceholder} aria-hidden="true" />
                  )}

                  <button
                    type="button"
                    className={styles.itemButton}
                    onClick={() => handleNavigate(item.href)}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    data-branch-active={isActiveBranch || undefined}
                  >
                    <span className={styles.itemLabel}>{item.label || item.href}</span>
                  </button>
                </div>
                {hasChildren && !collapsed ? renderItems(item.subitems, depth + 1) : null}
              </li>
            );
          })}
        </ul>
      );
    },
    [activeId, activePath, collapsedIds, handleNavigate, toggleSection]
  );

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClassName}>
      <div className={styles.header}>{title}</div>
      <div className={styles.content} role="presentation">
        {isLoading ? (
          <div className={styles.emptyState} role="status" aria-live="polite">
            Loading table of contents…
          </div>
        ) : toc && toc.length ? (
          renderItems(toc, 0)
        ) : (
          <div className={styles.emptyState}>{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
