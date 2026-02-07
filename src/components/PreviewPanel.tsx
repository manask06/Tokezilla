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

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-muted-foreground dark:border-slate-700">
        Preview will appear here
      </div>
    </aside>
  );
}
