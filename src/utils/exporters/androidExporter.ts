import type { Token } from '@/types/tokens';
import type { ExportContext, ExportFile } from '@/utils/exporters/types';
import {
  escapeXml,
  parseCssColor,
  rgbaToAndroidHex,
  toFileSlug,
  toSnakeCase,
} from '@/utils/exporters/shared';

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function convertToAndroidDimension(
  rawValue: string,
  unitKind: 'spacing' | 'text',
): string | null {
  const trimmed = rawValue.trim();
  const match = trimmed.match(/^(-?(?:\d+|\d*\.\d+))(px|rem|em|%)?$/i);
  if (!match) {
    return null;
  }

  const amountRaw = match[1];
  const unitRaw = match[2]?.toLowerCase();
  if (!amountRaw) {
    return null;
  }

  const amount = Number.parseFloat(amountRaw);
  if (!Number.isFinite(amount)) {
    return null;
  }

  if (unitRaw === '%') {
    return null;
  }

  if (unitRaw === 'rem' || unitRaw === 'em') {
    const converted = amount * 16;
    const targetUnit = unitKind === 'text' ? 'sp' : 'dp';
    return `${formatNumber(converted)}${targetUnit}`;
  }

  const targetUnit = unitKind === 'text' ? 'sp' : 'dp';
  return `${formatNumber(amount)}${targetUnit}`;
}

function buildColorsXml(tokens: Token[], themeName: string): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    `    <!-- Tokezilla export | Theme: ${escapeXml(themeName)} -->`,
  ];

  const colorTokens = tokens.filter((token) => token.$type === 'color');

  if (colorTokens.length === 0) {
    lines.push('    <!-- No color tokens available -->');
  } else {
    for (const token of colorTokens) {
      if (typeof token.$value !== 'string') {
        continue;
      }

      const parsedColor = parseCssColor(token.$value);
      if (!parsedColor) {
        lines.push(
          `    <!-- Skipped ${escapeXml(token.name)}: unsupported color ${escapeXml(token.$value)} -->`,
        );
        continue;
      }

      const androidHex = rgbaToAndroidHex(parsedColor);
      lines.push(
        `    <color name="${toSnakeCase(token.name)}">${androidHex}</color>`,
      );
    }
  }

  lines.push('</resources>');
  return lines.join('\n');
}

function buildDimensXml(tokens: Token[], themeName: string): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    `    <!-- Tokezilla export | Theme: ${escapeXml(themeName)} -->`,
  ];

  const spacingTokens = tokens.filter((token) => token.$type === 'dimension');
  const typographyTokens = tokens.filter(
    (token) => token.$type === 'typography' && typeof token.$value === 'object',
  );

  if (spacingTokens.length === 0 && typographyTokens.length === 0) {
    lines.push('    <!-- No dimension or typography size tokens available -->');
  }

  for (const token of spacingTokens) {
    if (typeof token.$value !== 'string') {
      continue;
    }

    const converted = convertToAndroidDimension(token.$value, 'spacing');
    if (!converted) {
      lines.push(
        `    <!-- Skipped ${escapeXml(token.name)}: unsupported dimension ${escapeXml(token.$value)} -->`,
      );
      continue;
    }

    lines.push(
      `    <dimen name="${toSnakeCase(token.name)}">${converted}</dimen>`,
    );
  }

  for (const token of typographyTokens) {
    if (typeof token.$value !== 'object') {
      continue;
    }

    if (token.$value.fontSize) {
      const convertedSize = convertToAndroidDimension(
        token.$value.fontSize,
        'text',
      );
      if (convertedSize) {
        lines.push(
          `    <dimen name="${toSnakeCase(token.name)}_font_size">${convertedSize}</dimen>`,
        );
      } else {
        lines.push(
          `    <!-- Skipped ${escapeXml(token.name)} fontSize: unsupported value ${escapeXml(token.$value.fontSize)} -->`,
        );
      }
    }

    if (token.$value.lineHeight) {
      const convertedLineHeight = convertToAndroidDimension(
        token.$value.lineHeight,
        'text',
      );
      if (convertedLineHeight) {
        lines.push(
          `    <dimen name="${toSnakeCase(token.name)}_line_height">${convertedLineHeight}</dimen>`,
        );
      } else {
        lines.push(
          `    <!-- Skipped ${escapeXml(token.name)} lineHeight: unsupported value ${escapeXml(token.$value.lineHeight)} -->`,
        );
      }
    }
  }

  lines.push('</resources>');
  return lines.join('\n');
}

export function exportAndroid(context: ExportContext): ExportFile[] {
  const files: ExportFile[] = [
    {
      path: 'colors.xml',
      platform: 'android',
      language: 'xml',
      content: buildColorsXml(context.tokens, context.themeName),
    },
    {
      path: 'dimens.xml',
      platform: 'android',
      language: 'xml',
      content: buildDimensXml(context.tokens, context.themeName),
    },
  ];

  return files.map(
    (file): ExportFile => ({
      ...file,
      path: `android/${toFileSlug(context.themeName)}/${file.path}`,
    }),
  );
}
