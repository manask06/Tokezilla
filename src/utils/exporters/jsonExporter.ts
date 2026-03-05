import type { Token, TokenType, TokenValue } from '@/types/tokens';
import type { ExportContext, ExportFile } from '@/utils/exporters/types';
import { toFileSlug } from '@/utils/exporters/shared';

interface DtcgNode {
  [key: string]: DtcgNode | DtcgLeaf;
}

interface DtcgLeaf {
  $value: TokenValue;
  $type: string;
  $description?: string;
}

function toDtcgType(type: TokenType): string {
  if (type === 'dimension') {
    return 'dimension';
  }
  if (type === 'color') {
    return 'color';
  }
  if (type === 'typography') {
    return 'typography';
  }

  return type;
}

function ensureObjectChild(parent: DtcgNode, key: string): DtcgNode {
  const current = parent[key];

  if (!current || ('$value' in current && '$type' in current)) {
    const next: DtcgNode = {};
    parent[key] = next;
    return next;
  }

  return current;
}

function insertToken(root: DtcgNode, token: Token): void {
  const path = token.name
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (path.length === 0) {
    return;
  }

  let cursor = root;

  for (const segment of path.slice(0, -1)) {
    cursor = ensureObjectChild(cursor, segment);
  }

  const finalSegment = path[path.length - 1];
  if (!finalSegment) {
    return;
  }

  const leaf: DtcgLeaf = {
    $value: token.$value,
    $type: toDtcgType(token.$type),
    ...(token.$description ? { $description: token.$description } : {}),
  };

  cursor[finalSegment] = leaf;
}

function buildDtcgTree(tokens: Token[]): DtcgNode {
  const root: DtcgNode = {};

  for (const token of tokens) {
    insertToken(root, token);
  }

  return root;
}

export function exportJson(context: ExportContext): ExportFile[] {
  const payload = {
    $metadata: {
      source: 'Tokezilla',
      theme: context.themeName,
      format: 'W3C DTCG',
    },
    tokens: buildDtcgTree(context.tokens),
  };

  return [
    {
      path: `${toFileSlug(context.themeName)}.tokens.json`,
      platform: 'json',
      language: 'json',
      content: JSON.stringify(payload, null, 2),
    },
  ];
}
