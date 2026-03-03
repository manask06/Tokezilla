import { Menu, Moon, Sun } from 'lucide-react';
import { ThemeManager } from '@/components/ThemeManager';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileSidebar: () => void;
}

export function Header({
  isDarkMode,
  onToggleDarkMode,
  onToggleMobileSidebar,
}: HeaderProps) {
  return (
    <div className="flex h-full items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleMobileSidebar}
          aria-label="Open token sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tokezilla 🦖</h1>
      </div>

      <nav aria-label="Header actions" className="flex items-center gap-2">
        <ThemeManager />
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" disabled>
          Export
        </Button>
        <Button variant="outline" disabled>
          Import
        </Button>
      </nav>
    </div>
  );
}
