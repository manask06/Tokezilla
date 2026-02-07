export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'shadow';

export type TokenValue = string | number | Record<string, unknown>;

export interface Token {
  id: string;
  name: string;
  $value: TokenValue;
  $type: TokenType;
  $description?: string;
}

export interface ThemeSet {
  id: string;
  name: string;
  isDefault: boolean;
  tokens: Token[];
}

export type TokenGroup = 'colors' | 'spacing' | 'typography';
