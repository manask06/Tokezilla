import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTokenStore } from '@/store/tokenStore';
import type { TypographyValue } from '@/types/tokens';
import { resolveAllTokens } from '@/utils/tokenResolver';

function asTypographyValue(value: unknown): TypographyValue {
  if (value && typeof value === 'object') {
    return value as TypographyValue;
  }
  return {};
}

export function PreviewPanel() {
  const themes = useTokenStore((state) => state.themes);
  const activeThemeId = useTokenStore((state) => state.activeThemeId);
  const switchTheme = useTokenStore((state) => state.switchTheme);
  const tokens = useTokenStore((state) => state.tokens);
  let resolvedTokens = tokens;
  let resolveError: string | null = null;
  try {
    resolvedTokens = resolveAllTokens(tokens);
  } catch (error) {
    resolveError =
      error instanceof Error ? error.message : 'Failed to resolve aliases';
  }

  const colorTokens = resolvedTokens.filter((token) => token.$type === 'color');
  const dimensionTokens = resolvedTokens.filter(
    (token) => token.$type === 'dimension',
  );
  const typographyTokens = resolvedTokens.filter(
    (token) => token.$type === 'typography',
  );

  return (
    <aside className="h-full p-4 md:p-6" aria-label="Token preview panel">
      <h2 className="text-xl font-semibold">Live Preview</h2>

      <div className="mt-4">
        <label className="mb-2 block text-sm text-muted-foreground">
          Theme
        </label>
        <Select value={activeThemeId} onValueChange={switchTheme}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {themes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        {resolveError ? (
          <p className="text-xs text-red-600">{resolveError}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">Live colors preview</p>
        <div className="grid grid-cols-2 gap-2">
          {colorTokens.slice(0, 6).map((token) => (
            <div
              key={token.id}
              className="rounded-md border border-slate-200 p-2 text-xs dark:border-slate-700"
            >
              <div
                className="mb-2 h-8 rounded"
                style={{
                  backgroundColor:
                    typeof token.$value === 'string' ? token.$value : '#94a3b8',
                }}
              />
              <p className="truncate font-medium">{token.name}</p>
            </div>
          ))}
          {colorTokens.length === 0 ? (
            <p className="col-span-2 text-xs text-muted-foreground">
              Preview will appear here
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm text-muted-foreground">Spacing preview</p>
        <div className="space-y-2">
          {dimensionTokens.slice(0, 4).map((token) => (
            <div
              key={token.id}
              className="rounded border border-slate-200 p-2 dark:border-slate-700"
            >
              <p className="text-xs font-medium">{token.name}</p>
              <div
                className="mt-1 h-2 rounded bg-slate-700 dark:bg-slate-300"
                style={{
                  width:
                    typeof token.$value === 'string'
                      ? `min(${token.$value}, 100%)`
                      : '16px',
                }}
              />
            </div>
          ))}
          {dimensionTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No spacing tokens yet
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm text-muted-foreground">Typography preview</p>
        <div className="space-y-2">
          {typographyTokens.slice(0, 3).map((token) => {
            const value = asTypographyValue(token.$value);
            return (
              <div
                key={token.id}
                className="rounded border border-slate-200 p-2 dark:border-slate-700"
              >
                <p className="text-xs font-medium">{token.name}</p>
                <p
                  className="mt-1 truncate"
                  style={{
                    fontFamily: value.fontFamily || 'inherit',
                    fontSize: value.fontSize || '16px',
                    fontWeight: value.fontWeight || 400,
                    lineHeight: value.lineHeight || '1.5',
                  }}
                >
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            );
          })}
          {typographyTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No typography tokens yet
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
