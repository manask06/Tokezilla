import type { Token, TypographyValue } from '@/types/tokens';
import { resolveAllTokens } from '@/utils/tokenResolver';

function toCssVarName(tokenName: string): string {
  return tokenName.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
}

function stringifyTypographyValue(
  tokenName: string,
  value: TypographyValue,
): Array<{ key: string; value: string }> {
  const varName = toCssVarName(tokenName);
  const declarations: Array<{ key: string; value: string }> = [];

  if (value.fontFamily) {
    declarations.push({
      key: `--${varName}-font-family`,
      value: value.fontFamily,
    });
  }
  if (value.fontSize) {
    declarations.push({
      key: `--${varName}-font-size`,
      value: value.fontSize,
    });
  }
  if (value.fontWeight) {
    declarations.push({
      key: `--${varName}-font-weight`,
      value: String(value.fontWeight),
    });
  }
  if (value.lineHeight) {
    declarations.push({
      key: `--${varName}-line-height`,
      value: value.lineHeight,
    });
  }

  return declarations;
}

function tokenToDeclarations(
  token: Token,
): Array<{ key: string; value: string }> {
  if (typeof token.$value === 'string') {
    return [{ key: `--${toCssVarName(token.name)}`, value: token.$value }];
  }

  if (typeof token.$value === 'number') {
    return [
      { key: `--${toCssVarName(token.name)}`, value: String(token.$value) },
    ];
  }

  if (token.$type === 'typography') {
    return stringifyTypographyValue(token.name, token.$value);
  }

  return [];
}

export function generateCssVariables(tokens: Token[]): string {
  const resolvedTokens = resolveAllTokens(tokens);
  const declarations = resolvedTokens.flatMap((token) =>
    tokenToDeclarations(token),
  );

  const lines = declarations.map(({ key, value }) => `  ${key}: ${value};`);
  return [':root {', ...lines, '}'].join('\n');
}
