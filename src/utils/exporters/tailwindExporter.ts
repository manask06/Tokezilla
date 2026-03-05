import type { Token } from '@/types/tokens';
import type { ExportContext, ExportFile } from '@/utils/exporters/types';
import { toFileSlug, toKebabCase } from '@/utils/exporters/shared';

interface ThemeExtendShape {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
}

function splitFontFamily(value: string): string[] {
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^['"]|['"]$/g, ''));
}

function collectThemeExtend(tokens: Token[]): ThemeExtendShape {
  const extend: ThemeExtendShape = {
    colors: {},
    spacing: {},
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
  };

  for (const token of tokens) {
    const key = toKebabCase(token.name);

    if (token.$type === 'color' && typeof token.$value === 'string') {
      extend.colors[key] = token.$value;
      continue;
    }

    if (token.$type === 'dimension' && typeof token.$value === 'string') {
      extend.spacing[key] = token.$value;
      continue;
    }

    if (token.$type === 'fontFamily' && typeof token.$value === 'string') {
      extend.fontFamily[key] = splitFontFamily(token.$value);
      continue;
    }

    if (token.$type === 'fontSize' && typeof token.$value === 'string') {
      extend.fontSize[key] = token.$value;
      continue;
    }

    if (token.$type === 'fontWeight') {
      extend.fontWeight[key] = String(token.$value);
      continue;
    }

    if (token.$type === 'lineHeight' && typeof token.$value === 'string') {
      extend.lineHeight[key] = token.$value;
      continue;
    }

    if (token.$type !== 'typography' || typeof token.$value !== 'object') {
      continue;
    }

    if (token.$value.fontFamily) {
      extend.fontFamily[key] = splitFontFamily(token.$value.fontFamily);
    }
    if (token.$value.fontSize) {
      extend.fontSize[key] = token.$value.fontSize;
    }
    if (typeof token.$value.fontWeight === 'number') {
      extend.fontWeight[key] = String(token.$value.fontWeight);
    }
    if (token.$value.lineHeight) {
      extend.lineHeight[key] = token.$value.lineHeight;
    }
  }

  return extend;
}

function removeEmptySections(
  extend: ThemeExtendShape,
): Record<string, unknown> {
  const sectionEntries = Object.entries(extend).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Object.keys(value).length > 0;
  });

  return Object.fromEntries(sectionEntries);
}

export function exportTailwind(context: ExportContext): ExportFile[] {
  const extendSections = collectThemeExtend(context.tokens);
  const compactExtend = removeEmptySections(extendSections);
  const serializedExtend = JSON.stringify(compactExtend, null, 2);

  const lines = [
    "import type { Config } from 'tailwindcss';",
    '',
    `/* Tokezilla export | Theme: ${context.themeName} */`,
    "export const themeExtend: Config['theme'] = {",
    `  extend: ${serializedExtend.replaceAll('\n', '\n  ')}`,
    '};',
    '',
    'export default themeExtend;',
  ];

  return [
    {
      path: `${toFileSlug(context.themeName)}.tailwind.ts`,
      platform: 'tailwind',
      language: 'typescript',
      content: lines.join('\n'),
    },
  ];
}
