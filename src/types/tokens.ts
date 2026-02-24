export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'typography';

export interface TypographyValue {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
}

export type TokenValue = string | number | TypographyValue;

export interface Token {
  id: string;
  name: string;
  $value: TokenValue;
  $type: TokenType;
  $description?: string;
}

export interface DimensionToken {
  id: string;
  name: string;
  $value: string;
  $type: 'dimension';
  $description?: string;
}

export interface TypographyToken {
  id: string;
  name: string;
  $value: TypographyValue;
  $type: 'typography';
  $description?: string;
}

export interface ThemeSet {
  id: string;
  name: string;
  isDefault: boolean;
  tokens: Token[];
}

export type TokenGroup = 'colors' | 'spacing' | 'typography';
