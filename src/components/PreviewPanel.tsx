import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTokenStore } from '@/store/tokenStore';

export function PreviewPanel() {
  const themes = useTokenStore((state) => state.themes);
  const activeThemeId = useTokenStore((state) => state.activeThemeId);
  const switchTheme = useTokenStore((state) => state.switchTheme);
  const tokens = useTokenStore((state) => state.tokens);
  const colorTokens = tokens.filter((token) => token.$type === 'color');

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
    </aside>
  );
}
