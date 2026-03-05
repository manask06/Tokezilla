import type { Token } from '@/types/tokens';

export type ExportPlatform = 'css' | 'tailwind' | 'ios' | 'android' | 'json';
export type ExportLanguage =
  | 'css'
  | 'typescript'
  | 'swift'
  | 'xml'
  | 'json'
  | 'text';

export interface ExportFile {
  path: string;
  platform: ExportPlatform;
  language: ExportLanguage;
  content: string;
}

export interface ExportContext {
  themeName: string;
  tokens: Token[];
}
