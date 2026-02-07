import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Sidebar } from '@/components/Sidebar';
import { TokenEditor } from '@/components/TokenEditor';

const THEME_STORAGE_KEY = 'tokezilla-ui-theme';

export function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((current) => {
      const nextValue = !current;
      document.documentElement.classList.toggle('dark', nextValue);
      localStorage.setItem(THEME_STORAGE_KEY, nextValue ? 'dark' : 'light');
      return nextValue;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((open) => !open)}
        />
      </header>

      <div className="relative flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 lg:block dark:border-slate-700 dark:bg-slate-900">
          <Sidebar />
        </aside>

        {isMobileSidebarOpen ? (
          <aside className="absolute inset-y-0 left-0 z-20 w-72 border-r border-slate-200 bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900">
            <Sidebar />
          </aside>
        ) : null}

        <main className="flex flex-1 flex-col xl:flex-row">
          <section className="flex-1 bg-white dark:bg-slate-800">
            <TokenEditor />
          </section>
          <section className="w-full border-t border-slate-200 bg-slate-50 xl:w-96 xl:border-t-0 xl:border-l dark:border-slate-700 dark:bg-slate-900">
            <PreviewPanel />
          </section>
        </main>
      </div>
    </div>
  );
}
