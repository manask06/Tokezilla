import type { ExportContext, ExportFile } from '@/utils/exporters/types';
import {
  escapeDoubleQuotes,
  parseCssColor,
  stringifyTokenValue,
  toCamelCase,
  toFileSlug,
} from '@/utils/exporters/shared';

function toSwiftDecimal(value: number): string {
  return value.toFixed(4);
}

function createColorExpression(rawValue: string): string {
  const parsedColor = parseCssColor(rawValue);
  if (!parsedColor) {
    return 'UIColor.clear';
  }

  const red = toSwiftDecimal(parsedColor.r / 255);
  const green = toSwiftDecimal(parsedColor.g / 255);
  const blue = toSwiftDecimal(parsedColor.b / 255);
  const alpha = toSwiftDecimal(parsedColor.a);

  return `UIColor(red: ${red}, green: ${green}, blue: ${blue}, alpha: ${alpha})`;
}

export function exportIos(context: ExportContext): ExportFile[] {
  const colorTokens = context.tokens.filter((token) => token.$type === 'color');
  const dimensionTokens = context.tokens.filter(
    (token) => token.$type === 'dimension',
  );
  const typographyTokens = context.tokens.filter(
    (token) => token.$type === 'typography' && typeof token.$value === 'object',
  );

  const lines: string[] = [
    'import UIKit',
    '',
    `// Tokezilla export | Theme: ${context.themeName}`,
    '',
    'public enum TokezillaColors {',
  ];

  if (colorTokens.length === 0) {
    lines.push('  // No color tokens available');
  } else {
    for (const token of colorTokens) {
      if (typeof token.$value !== 'string') {
        continue;
      }

      const swiftName = toCamelCase(token.name);
      const colorValue = token.$value;
      const expression = createColorExpression(colorValue);
      const comment = parseCssColor(colorValue)
        ? `// ${colorValue}`
        : `// Unsupported CSS color: ${colorValue}`;
      lines.push(`  public static let ${swiftName} = ${expression} ${comment}`);
    }
  }

  lines.push('}');
  lines.push('');
  lines.push('public enum TokezillaDimensions {');

  if (dimensionTokens.length === 0) {
    lines.push('  // No dimension tokens available');
  } else {
    for (const token of dimensionTokens) {
      const swiftName = toCamelCase(token.name);
      lines.push(
        `  public static let ${swiftName} = "${escapeDoubleQuotes(stringifyTokenValue(token.$value))}"`,
      );
    }
  }

  lines.push('}');
  lines.push('');
  lines.push('public struct TokezillaTypographyToken {');
  lines.push('  public let fontFamily: String?');
  lines.push('  public let fontSize: String?');
  lines.push('  public let fontWeight: Int?');
  lines.push('  public let lineHeight: String?');
  lines.push('}');
  lines.push('');
  lines.push('public enum TokezillaTypography {');

  if (typographyTokens.length === 0) {
    lines.push('  // No typography tokens available');
  } else {
    for (const token of typographyTokens) {
      if (typeof token.$value !== 'object') {
        continue;
      }

      const swiftName = toCamelCase(token.name);
      const fontFamily = token.$value.fontFamily
        ? `"${escapeDoubleQuotes(token.$value.fontFamily)}"`
        : 'nil';
      const fontSize = token.$value.fontSize
        ? `"${escapeDoubleQuotes(token.$value.fontSize)}"`
        : 'nil';
      const fontWeight =
        typeof token.$value.fontWeight === 'number'
          ? String(token.$value.fontWeight)
          : 'nil';
      const lineHeight = token.$value.lineHeight
        ? `"${escapeDoubleQuotes(token.$value.lineHeight)}"`
        : 'nil';

      lines.push(
        `  public static let ${swiftName} = TokezillaTypographyToken(fontFamily: ${fontFamily}, fontSize: ${fontSize}, fontWeight: ${fontWeight}, lineHeight: ${lineHeight})`,
      );
    }
  }

  lines.push('}');

  return [
    {
      path: `${toFileSlug(context.themeName)}.swift`,
      platform: 'ios',
      language: 'swift',
      content: lines.join('\n'),
    },
  ];
}
