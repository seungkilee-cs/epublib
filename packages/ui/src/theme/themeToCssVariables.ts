import { ReaderTheme } from "./tokens";

const PREFIX = "--reader";

function flattenTheme(prefix: string, value: unknown, result: Record<string, string>) {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      flattenTheme(`${prefix}-${key}`, nested, result);
    });
    return;
  }

  result[prefix] = String(value);
}

export function themeToCssVariables(theme: ReaderTheme): Record<string, string> {
  const variables: Record<string, string> = {};
  flattenTheme(`${PREFIX}-color`, theme.colors, variables);
  flattenTheme(`${PREFIX}-spacing`, theme.spacing, variables);
  flattenTheme(`${PREFIX}-radius`, theme.radii, variables);
  flattenTheme(`${PREFIX}-typography-font-size`, theme.typography.fontSize, variables);
  flattenTheme(
    `${PREFIX}-typography-line-height`,
    theme.typography.lineHeight,
    variables
  );
  if (theme.typography.fontFamily) {
    variables[`${PREFIX}-typography-font-family`] = theme.typography.fontFamily;
  }
  flattenTheme(`${PREFIX}-shadow`, theme.shadows, variables);

  return variables;
}
