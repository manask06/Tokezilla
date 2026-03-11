import { z } from 'zod';
import type {
  Token,
  TokenType,
  TokenValue,
  TypographyValue,
} from '@/types/tokens';

const tokenNameRegex = /^[a-zA-Z0-9_.-]+$/;

const tokenTypeSchema = z.enum([
  'color',
  'dimension',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'typography',
]);

const typographyValueSchema = z
  .object({
    fontFamily: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.number().int().optional(),
    lineHeight: z.string().optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.fontFamily ||
        value.fontSize ||
        typeof value.fontWeight === 'number' ||
        value.lineHeight,
      ),
    {
      message: 'Typography value must include at least one property.',
    },
  );

const tokenValueSchema = z.union([
  z.string(),
  z.number(),
  typographyValueSchema,
]);

const importedTokenSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .min(1, 'Token name is required')
      .regex(tokenNameRegex, 'Token name contains invalid characters'),
    $value: tokenValueSchema,
    $type: tokenTypeSchema,
    $description: z.string().optional(),
  })
  .superRefine((token, context) => {
    if (token.$type === 'typography' && typeof token.$value !== 'object') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Typography token requires an object value.',
        path: ['$value'],
      });
    }

    if (token.$type !== 'typography' && typeof token.$value === 'object') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only typography tokens can use object values.',
        path: ['$value'],
      });
    }
  });

const importedThemeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Theme name is required'),
  isDefault: z.boolean().optional(),
  tokens: z.array(importedTokenSchema),
});

const appImportSchema = z.object({
  themes: z.array(importedThemeSchema).min(1, 'At least one theme is required'),
  activeThemeId: z.string().optional(),
});

const persistedImportSchema = z.object({
  state: appImportSchema,
});

export interface ImportThemePayload {
  name: string;
  isDefault?: boolean;
  tokens: Omit<Token, 'id'>[];
}

export interface ParsedImportPayload {
  source: 'app' | 'dtcg';
  themes: ImportThemePayload[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDtcgLeaf(value: unknown): value is {
  $value: unknown;
  $type: unknown;
  $description?: unknown;
} {
  if (!isRecord(value)) {
    return false;
  }

  return '$value' in value && '$type' in value;
}

function flattenDtcgTokens(
  current: unknown,
  path: string[],
  sink: Array<{
    name: string;
    $value: unknown;
    $type: unknown;
    $description?: unknown;
  }>,
): void {
  if (!isRecord(current)) {
    return;
  }

  if (isDtcgLeaf(current)) {
    if (path.length === 0) {
      return;
    }

    sink.push({
      name: path.join('.'),
      $value: current.$value,
      $type: current.$type,
      ...(typeof current.$description === 'string'
        ? { $description: current.$description }
        : {}),
    });
    return;
  }

  for (const [key, value] of Object.entries(current)) {
    if (key.startsWith('$')) {
      continue;
    }

    flattenDtcgTokens(value, [...path, key], sink);
  }
}

function normalizeToken(
  token: z.infer<typeof importedTokenSchema>,
): Omit<Token, 'id'> {
  const normalizedValue: TokenValue =
    typeof token.$value === 'object'
      ? ({ ...token.$value } as TypographyValue)
      : token.$value;

  return {
    name: token.name,
    $type: token.$type as TokenType,
    $value: normalizedValue,
    ...(token.$description ? { $description: token.$description } : {}),
  };
}

function normalizeThemes(
  themes: z.infer<typeof importedThemeSchema>[],
): ImportThemePayload[] {
  return themes.map((theme) => ({
    name: theme.name,
    ...(theme.isDefault ? { isDefault: true } : {}),
    tokens: theme.tokens.map((token) => normalizeToken(token)),
  }));
}

function parseAsAppFormat(payload: unknown): ParsedImportPayload | null {
  const directParse = appImportSchema.safeParse(payload);
  if (directParse.success) {
    return {
      source: 'app',
      themes: normalizeThemes(directParse.data.themes),
    };
  }

  const persistedParse = persistedImportSchema.safeParse(payload);
  if (persistedParse.success) {
    return {
      source: 'app',
      themes: normalizeThemes(persistedParse.data.state.themes),
    };
  }

  return null;
}

function parseThemeNameFromMetadata(payload: Record<string, unknown>): string {
  const metadata = payload.$metadata;
  if (!isRecord(metadata)) {
    return 'Imported Theme';
  }

  const rawThemeName = metadata.theme;
  return typeof rawThemeName === 'string' && rawThemeName.trim().length > 0
    ? rawThemeName
    : 'Imported Theme';
}

function parseAsDtcgFormat(payload: unknown): ParsedImportPayload {
  if (!isRecord(payload)) {
    throw new Error('JSON root must be an object.');
  }

  const tokenRoot = isRecord(payload.tokens) ? payload.tokens : payload;
  const flattened: Array<{
    name: string;
    $value: unknown;
    $type: unknown;
    $description?: unknown;
  }> = [];

  flattenDtcgTokens(tokenRoot, [], flattened);

  if (flattened.length === 0) {
    throw new Error('No DTCG token leaves found in JSON.');
  }

  const validatedTokens = flattened.map((token) => {
    const parsed = importedTokenSchema.safeParse(token);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const issueMessage = firstIssue ? firstIssue.message : 'Invalid token';
      throw new Error(`Token "${token.name}" invalid: ${issueMessage}`);
    }

    return normalizeToken(parsed.data);
  });

  return {
    source: 'dtcg',
    themes: [
      {
        name: parseThemeNameFromMetadata(payload),
        isDefault: true,
        tokens: validatedTokens,
      },
    ],
  };
}

export function parseImportJson(rawJson: string): ParsedImportPayload {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  const appPayload = parseAsAppFormat(parsedValue);
  if (appPayload) {
    return appPayload;
  }

  return parseAsDtcgFormat(parsedValue);
}
