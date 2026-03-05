import type { Token } from '@/types/tokens';
import { resolveAllTokens } from '@/utils/tokenResolver';
import { exportAndroid } from '@/utils/exporters/androidExporter';
import { exportCss } from '@/utils/exporters/cssExporter';
import { exportIos } from '@/utils/exporters/iosExporter';
import { exportJson } from '@/utils/exporters/jsonExporter';
import { exportTailwind } from '@/utils/exporters/tailwindExporter';
import type { ExportFile, ExportPlatform } from '@/utils/exporters/types';

const ALL_PLATFORMS: ExportPlatform[] = [
  'css',
  'tailwind',
  'ios',
  'android',
  'json',
];

export function getAllExportPlatforms(): ExportPlatform[] {
  return [...ALL_PLATFORMS];
}

export function buildExportFiles(
  themeName: string,
  tokens: Token[],
  platforms: ExportPlatform[],
): ExportFile[] {
  const resolvedTokens = resolveAllTokens(tokens);
  const selectedPlatforms = new Set(platforms);
  const files: ExportFile[] = [];

  if (selectedPlatforms.has('css')) {
    files.push(...exportCss({ themeName, tokens: resolvedTokens }));
  }
  if (selectedPlatforms.has('tailwind')) {
    files.push(...exportTailwind({ themeName, tokens: resolvedTokens }));
  }
  if (selectedPlatforms.has('ios')) {
    files.push(...exportIos({ themeName, tokens: resolvedTokens }));
  }
  if (selectedPlatforms.has('android')) {
    files.push(...exportAndroid({ themeName, tokens: resolvedTokens }));
  }
  if (selectedPlatforms.has('json')) {
    files.push(...exportJson({ themeName, tokens: resolvedTokens }));
  }

  return files;
}
