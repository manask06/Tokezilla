import type { Token, TokenValue, TypographyValue } from '@/types/tokens';

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const TOKEN_SPLIT_REGEX = /[^a-zA-Z0-9]+/g;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR_REGEX =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;
const HSL_COLOR_REGEX =
  /^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function splitIntoSegments(value: string): string[] {
  return value
    .trim()
    .split(TOKEN_SPLIT_REGEX)
    .filter((segment) => segment.length > 0);
}

function capitalize(value: string): string {
  const head = value.charAt(0).toUpperCase();
  const tail = value.slice(1);
  return `${head}${tail}`;
}

function hslToRgb(hue: number, sat: number, light: number): RgbaColor {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clamp(sat, 0, 100) / 100;
  const normalizedLightness = clamp(light, 0, 100) / 100;

  if (normalizedSaturation === 0) {
    const gray = Math.round(normalizedLightness * 255);
    return { r: gray, g: gray, b: gray, a: 1 };
  }

  const chroma =
    (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const matchLight = normalizedLightness - chroma / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (normalizedHue < 60) {
    r1 = chroma;
    g1 = secondary;
  } else if (normalizedHue < 120) {
    r1 = secondary;
    g1 = chroma;
  } else if (normalizedHue < 180) {
    g1 = chroma;
    b1 = secondary;
  } else if (normalizedHue < 240) {
    g1 = secondary;
    b1 = chroma;
  } else if (normalizedHue < 300) {
    r1 = secondary;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = secondary;
  }

  return {
    r: Math.round((r1 + matchLight) * 255),
    g: Math.round((g1 + matchLight) * 255),
    b: Math.round((b1 + matchLight) * 255),
    a: 1,
  };
}

export function toKebabCase(value: string): string {
  const segments = splitIntoSegments(value);
  if (segments.length === 0) {
    return 'token';
  }

  return segments.join('-').toLowerCase();
}

export function toSnakeCase(value: string): string {
  const segments = splitIntoSegments(value);
  if (segments.length === 0) {
    return 'token';
  }

  return segments.join('_').toLowerCase();
}

export function toCamelCase(value: string): string {
  const segments = splitIntoSegments(value);
  if (segments.length === 0) {
    return 'token';
  }

  const [first, ...rest] = segments;
  if (!first) {
    return 'token';
  }

  const suffix = rest
    .map((segment) => capitalize(segment.toLowerCase()))
    .join('');
  return `${first.toLowerCase()}${suffix}`;
}

export function toPascalCase(value: string): string {
  const segments = splitIntoSegments(value);
  if (segments.length === 0) {
    return 'Token';
  }

  return segments.map((segment) => capitalize(segment.toLowerCase())).join('');
}

export function toFileSlug(value: string): string {
  return toKebabCase(value);
}

export function toCssVarName(tokenName: string): string {
  return tokenName.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function escapeDoubleQuotes(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function stringifyTokenValue(value: TokenValue): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value);
}

export function isTypographyValue(value: TokenValue): value is TypographyValue {
  return typeof value === 'object' && value !== null;
}

export function parseCssColor(rawColor: string): RgbaColor | null {
  const value = rawColor.trim();
  const hexMatch = value.match(HEX_COLOR_REGEX);
  if (hexMatch) {
    const hex = hexMatch[1]?.toLowerCase();
    if (!hex) {
      return null;
    }

    if (hex.length === 3) {
      const rChar = hex.slice(0, 1);
      const gChar = hex.slice(1, 2);
      const bChar = hex.slice(2, 3);
      if (!rChar || !gChar || !bChar) {
        return null;
      }

      const r = Number.parseInt(rChar + rChar, 16);
      const g = Number.parseInt(gChar + gChar, 16);
      const b = Number.parseInt(bChar + bChar, 16);
      return { r, g, b, a: 1 };
    }

    if (hex.length === 4) {
      const rChar = hex.slice(0, 1);
      const gChar = hex.slice(1, 2);
      const bChar = hex.slice(2, 3);
      const aChar = hex.slice(3, 4);
      if (!rChar || !gChar || !bChar || !aChar) {
        return null;
      }

      const r = Number.parseInt(rChar + rChar, 16);
      const g = Number.parseInt(gChar + gChar, 16);
      const b = Number.parseInt(bChar + bChar, 16);
      const alpha = Number.parseInt(aChar + aChar, 16) / 255;
      return { r, g, b, a: alpha };
    }

    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }

    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const alpha = Number.parseInt(hex.slice(6, 8), 16) / 255;
    return { r, g, b, a: alpha };
  }

  const rgbMatch = value.match(RGB_COLOR_REGEX);
  if (rgbMatch) {
    const redRaw = rgbMatch[1];
    const greenRaw = rgbMatch[2];
    const blueRaw = rgbMatch[3];
    const alphaRaw = rgbMatch[4];
    if (!redRaw || !greenRaw || !blueRaw) {
      return null;
    }

    const red = clamp(Number.parseInt(redRaw, 10), 0, 255);
    const green = clamp(Number.parseInt(greenRaw, 10), 0, 255);
    const blue = clamp(Number.parseInt(blueRaw, 10), 0, 255);
    const alpha = alphaRaw ? clamp(Number.parseFloat(alphaRaw), 0, 1) : 1;
    return { r: red, g: green, b: blue, a: alpha };
  }

  const hslMatch = value.match(HSL_COLOR_REGEX);
  if (hslMatch) {
    const hueRaw = hslMatch[1];
    const saturationRaw = hslMatch[2];
    const lightnessRaw = hslMatch[3];
    const alphaRaw = hslMatch[4];
    if (!hueRaw || !saturationRaw || !lightnessRaw) {
      return null;
    }

    const hue = Number.parseFloat(hueRaw);
    const saturation = clamp(Number.parseFloat(saturationRaw), 0, 100);
    const lightness = clamp(Number.parseFloat(lightnessRaw), 0, 100);
    const alpha = alphaRaw ? clamp(Number.parseFloat(alphaRaw), 0, 1) : 1;
    const rgb = hslToRgb(hue, saturation, lightness);
    return { ...rgb, a: alpha };
  }

  return null;
}

export function rgbaToHex(color: RgbaColor, includeAlpha = false): string {
  const red = color.r.toString(16).padStart(2, '0');
  const green = color.g.toString(16).padStart(2, '0');
  const blue = color.b.toString(16).padStart(2, '0');

  if (!includeAlpha) {
    return `#${red}${green}${blue}`.toUpperCase();
  }

  const alpha = Math.round(clamp(color.a, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${red}${green}${blue}${alpha}`.toUpperCase();
}

export function rgbaToAndroidHex(color: RgbaColor): string {
  const alpha = Math.round(clamp(color.a, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0');
  const red = color.r.toString(16).padStart(2, '0');
  const green = color.g.toString(16).padStart(2, '0');
  const blue = color.b.toString(16).padStart(2, '0');
  return `#${alpha}${red}${green}${blue}`.toUpperCase();
}

export function collectTypographyTokens(tokens: Token[]): Token[] {
  return tokens.filter((token) => token.$type === 'typography');
}
