import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTokenStore } from '@/store/tokenStore';
import type { Token } from '@/types/tokens';
import { generateCssVariables } from '@/utils/cssGenerator';
import { resolveAllTokens } from '@/utils/tokenResolver';

function toCssVarName(tokenName: string): string {
  return tokenName.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
}

function pickTokenByName(
  tokens: Token[],
  searchTerms: string[],
): Token | undefined {
  return tokens.find((token) =>
    searchTerms.some((term) => token.name.toLowerCase().includes(term)),
  );
}

export function PreviewPanel() {
  const themes = useTokenStore((state) => state.themes);
  const activeThemeId = useTokenStore((state) => state.activeThemeId);
  const switchTheme = useTokenStore((state) => state.switchTheme);
  const [cssVars, setCssVars] = useState(':root {\n}');
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvedTokens, setResolvedTokens] = useState<Token[]>([]);

  useEffect(() => {
    let timeoutId: number | undefined;

    const regenerate = (tokens: Token[]) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        try {
          setCssVars(generateCssVariables(tokens));
          setResolvedTokens(resolveAllTokens(tokens));
          setResolveError(null);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to resolve aliases';
          setResolveError(message);
        }
      }, 150);
    };

    regenerate(useTokenStore.getState().tokens);
    const unsubscribe = useTokenStore.subscribe((state) => {
      regenerate(state.tokens);
    });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, []);

  const colorTokens = resolvedTokens.filter((token) => token.$type === 'color');
  const typographyTokens = resolvedTokens.filter(
    (token) => token.$type === 'typography',
  );
  const hasResolvedTokens = resolvedTokens.length > 0;

  const primaryColorToken =
    pickTokenByName(colorTokens, ['primary', 'blue']) ?? colorTokens[0];
  const secondaryColorToken =
    pickTokenByName(colorTokens, ['secondary', 'gray', 'slate']) ??
    colorTokens[1];
  const textColorToken =
    pickTokenByName(colorTokens, ['text', 'foreground', 'neutral']) ??
    colorTokens[2];

  const typographyBase = typographyTokens[0];
  const typographyVarPrefix = typographyBase
    ? `--${toCssVarName(typographyBase.name)}`
    : null;

  const componentVars = {
    primary: primaryColorToken
      ? `var(--${toCssVarName(primaryColorToken.name)})`
      : '#2563eb',
    secondary: secondaryColorToken
      ? `var(--${toCssVarName(secondaryColorToken.name)})`
      : '#64748b',
    text: textColorToken
      ? `var(--${toCssVarName(textColorToken.name)})`
      : '#0f172a',
    fontFamily: typographyVarPrefix
      ? `var(${typographyVarPrefix}-font-family, Inter, sans-serif)`
      : 'Inter, sans-serif',
    fontSize: typographyVarPrefix
      ? `var(${typographyVarPrefix}-font-size, 16px)`
      : '16px',
    lineHeight: typographyVarPrefix
      ? `var(${typographyVarPrefix}-line-height, 1.5)`
      : '1.5',
  };

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssVars);
      toast.success('CSS copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <aside
      className="h-full overflow-y-auto p-4 md:p-6"
      aria-label="Token preview panel"
    >
      <style>{cssVars}</style>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Live Preview</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopyCss}
        >
          <Copy className="h-4 w-4" />
          Copy CSS
        </Button>
      </div>

      <div className="mt-4">
        <label
          htmlFor="preview-theme-select"
          className="mb-2 block text-sm text-muted-foreground"
        >
          Theme
        </label>
        <Select value={activeThemeId} onValueChange={switchTheme}>
          <SelectTrigger
            id="preview-theme-select"
            aria-label="Select preview theme"
            className="w-full"
          >
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

      {resolveError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300">
          {resolveError}
        </p>
      ) : null}

      {!resolveError && !hasResolvedTokens ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted-foreground dark:border-slate-700">
          No tokens yet. Add tokens to see live component previews.
        </div>
      ) : null}

      <section className="mt-5 space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: componentVars.primary }}
            type="button"
          >
            Primary
          </button>
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: componentVars.secondary }}
            type="button"
          >
            Secondary
          </button>
          <button
            className="rounded-md px-4 py-2 text-sm font-medium underline-offset-2 hover:underline"
            style={{ color: componentVars.primary }}
            type="button"
          >
            Text Button
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Card</h3>
        <div className="mt-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <div className="text-sm font-semibold">Card Header</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Card body content preview.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: componentVars.primary }}
              type="button"
            >
              Card Action
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Input Controls</h3>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          placeholder="Input preview"
        />
        <Textarea rows={3} placeholder="Textarea preview" />
        <select
          aria-label="Preview select input"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
        >
          <option>Option one</option>
          <option>Option two</option>
          <option>Option three</option>
        </select>
      </section>

      <section className="mt-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Typography Scale</h3>
        <div
          className="mt-2 space-y-2"
          style={{
            fontFamily: componentVars.fontFamily,
            color: componentVars.text,
            lineHeight: componentVars.lineHeight,
          }}
        >
          <h1 className="text-3xl font-bold">Heading 1</h1>
          <h2 className="text-2xl font-semibold">Heading 2</h2>
          <p style={{ fontSize: componentVars.fontSize }}>Body text sample</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Caption text
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Color Grid</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {colorTokens.slice(0, 10).map((token) => (
            <div
              key={token.id}
              className="rounded border border-slate-200 p-2 dark:border-slate-700"
            >
              <div
                className="h-8 rounded"
                style={{
                  backgroundColor:
                    typeof token.$value === 'string' ? token.$value : '#94a3b8',
                }}
              />
              <p className="mt-1 truncate text-xs">{token.name}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
