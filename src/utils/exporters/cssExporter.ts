import type { Token, TypographyValue } from '@/types/tokens';
import type { ExportContext, ExportFile } from '@/utils/exporters/types';
import { toCssVarName, toFileSlug } from '@/utils/exporters/shared';

interface CssDeclaration {
  key: string;
  value: string;
}

function typographyToDeclarations(
  tokenName: string,
  value: TypographyValue,
): CssDeclaration[] {
  const baseName = toCssVarName(tokenName);
  const declarations: CssDeclaration[] = [];

  if (value.fontFamily) {
    declarations.push({
      key: `--${baseName}-font-family`,
      value: value.fontFamily,
    });
  }
  if (value.fontSize) {
    declarations.push({
      key: `--${baseName}-font-size`,
      value: value.fontSize,
    });
  }
  if (typeof value.fontWeight === 'number') {
    declarations.push({
      key: `--${baseName}-font-weight`,
      value: String(value.fontWeight),
    });
  }
  if (value.lineHeight) {
    declarations.push({
      key: `--${baseName}-line-height`,
      value: value.lineHeight,
    });
  }

  return declarations;
}

function tokenToDeclarations(token: Token): CssDeclaration[] {
  if (typeof token.$value === 'string' || typeof token.$value === 'number') {
    return [
      {
        key: `--${toCssVarName(token.name)}`,
        value: String(token.$value),
      },
    ];
  }

  if (token.$type === 'typography') {
    return typographyToDeclarations(token.name, token.$value);
  }

  return [];
}

export function exportCss(context: ExportContext): ExportFile[] {
  const declarations = context.tokens.flatMap((token) =>
    tokenToDeclarations(token),
  );
  const lines = declarations.map(({ key, value }) => `  ${key}: ${value};`);
  const header = `/* Tokezilla export | Theme: ${context.themeName} */`;
  const content = [header, ':root {', ...lines, '}'].join('\n');

  return [
    {
      path: `${toFileSlug(context.themeName)}.css`,
      platform: 'css',
      language: 'css',
      content,
    },
  ];
}
