import type { Token, TokenValue, TypographyValue } from '@/types/tokens';

const TOKEN_REFERENCE_PATTERN = /^\{([^{}]+)\}$/;

export function isTokenReference(value: string): boolean {
  return TOKEN_REFERENCE_PATTERN.test(value.trim());
}

export function extractReferenceName(value: string): string | null {
  const match = value.trim().match(TOKEN_REFERENCE_PATTERN);
  return match ? (match[1] ?? null) : null;
}

function resolveStringValue(
  rawValue: string,
  tokenMap: Map<string, Token>,
  trail: string[],
): string {
  const referenceName = extractReferenceName(rawValue);
  if (!referenceName) {
    return rawValue;
  }

  if (trail.includes(referenceName)) {
    const startIndex = trail.indexOf(referenceName);
    const cycle = [...trail.slice(startIndex), referenceName];
    throw new Error(`Circular: ${cycle.join('→')}`);
  }

  const referencedToken = tokenMap.get(referenceName);
  if (!referencedToken) {
    throw new Error(`Missing reference: ${referenceName}`);
  }

  const resolvedValue = resolveTokenValue(referencedToken.$value, tokenMap, [
    ...trail,
    referenceName,
  ]);

  if (typeof resolvedValue !== 'string') {
    throw new Error(`Reference must resolve to string: ${referenceName}`);
  }

  return resolvedValue;
}

function resolveTypographyValue(
  value: TypographyValue,
  tokenMap: Map<string, Token>,
  trail: string[],
): TypographyValue {
  return {
    ...(value.fontFamily
      ? { fontFamily: resolveStringValue(value.fontFamily, tokenMap, trail) }
      : {}),
    ...(value.fontSize
      ? { fontSize: resolveStringValue(value.fontSize, tokenMap, trail) }
      : {}),
    ...(value.fontWeight ? { fontWeight: value.fontWeight } : {}),
    ...(value.lineHeight
      ? { lineHeight: resolveStringValue(value.lineHeight, tokenMap, trail) }
      : {}),
  };
}

export function resolveTokenValue(
  value: TokenValue,
  tokenMap: Map<string, Token>,
  trail: string[],
): TokenValue {
  if (typeof value === 'string') {
    return resolveStringValue(value, tokenMap, trail);
  }

  if (typeof value === 'number') {
    return value;
  }

  return resolveTypographyValue(value, tokenMap, trail);
}

export function resolveToken(token: Token, tokens: Token[]): Token {
  const tokenMap = new Map(tokens.map((item) => [item.name, item]));
  const resolved = resolveTokenValue(token.$value, tokenMap, [token.name]);
  return { ...token, $value: resolved };
}

export function resolveAllTokens(tokens: Token[]): Token[] {
  return tokens.map((token) => resolveToken(token, tokens));
}
