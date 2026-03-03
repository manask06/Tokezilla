import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Header } from '@/components/Header';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Sidebar } from '@/components/Sidebar';
import { TokenEditor } from '@/components/TokenEditor';
import { useTokenStore } from '@/store/tokenStore';
import type { Token, TokenType, TypographyValue } from '@/types/tokens';
import { resolveAllTokens } from '@/utils/tokenResolver';

const THEME_STORAGE_KEY = 'tokezilla-ui-theme';

export function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const tokens = useTokenStore((state) => state.tokens);
  const addToken = useTokenStore((state) => state.addToken);
  const updateToken = useTokenStore((state) => state.updateToken);
  const deleteToken = useTokenStore((state) => state.deleteToken);
  const selectedTokenGroup = useTokenStore((state) => state.selectedTokenGroup);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const selectedToken =
    selectedTokenId !== null
      ? (tokens.find((token) => token.id === selectedTokenId) ?? null)
      : null;

  const toggleDarkMode = () => {
    setIsDarkMode((current) => {
      const nextValue = !current;
      document.documentElement.classList.toggle('dark', nextValue);
      localStorage.setItem(THEME_STORAGE_KEY, nextValue ? 'dark' : 'light');
      return nextValue;
    });
  };

  const handleCreateToken = () => {
    setSelectedTokenId(null);
    setIsCreateMode(true);
  };

  const handleSelectToken = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setIsCreateMode(false);
  };

  const handleSaveToken = (values: {
    kind: 'color' | 'dimension' | 'typography';
    name: string;
    value: string | TypographyValue;
    description?: string | undefined;
  }) => {
    const normalizedDescription = values.description?.trim() || undefined;
    const descriptionPatch =
      normalizedDescription && normalizedDescription.length > 0
        ? { $description: normalizedDescription }
        : {};

    const valuePayload = values.value;
    const typePayload = values.kind as TokenType;
    const previewToken: Token = selectedToken
      ? {
          ...selectedToken,
          name: values.name,
          $value: valuePayload,
          $type: typePayload,
          ...descriptionPatch,
        }
      : {
          id: crypto.randomUUID(),
          name: values.name,
          $value: valuePayload,
          $type: typePayload,
          ...descriptionPatch,
        };

    const previewTokens = selectedToken
      ? tokens.map((token) =>
          token.id === selectedToken.id ? previewToken : token,
        )
      : [...tokens, previewToken];

    try {
      resolveAllTokens(previewTokens);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid token reference';
      toast.error(message);
      return;
    }

    if (selectedToken) {
      updateToken(selectedToken.id, {
        name: values.name,
        $value: valuePayload,
        $type: typePayload,
        ...descriptionPatch,
      });
      toast.success('Token updated');
      return;
    }

    addToken({
      name: values.name,
      $value: valuePayload,
      $type: typePayload,
      ...descriptionPatch,
    });
    setIsCreateMode(false);
    toast.success('Token created');
  };

  const handleCancel = () => {
    setSelectedTokenId(null);
    setIsCreateMode(false);
  };

  const handleDelete = (tokenId?: string) => {
    const idToDelete = tokenId ?? selectedToken?.id;
    if (!idToDelete) {
      return;
    }

    deleteToken(idToDelete);
    if (selectedTokenId === idToDelete) {
      setSelectedTokenId(null);
      setIsCreateMode(false);
    }
    toast.success('Token deleted');
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
          <Sidebar
            selectedTokenId={selectedTokenId}
            onSelectToken={handleSelectToken}
            onCreateToken={handleCreateToken}
            onDeleteToken={(tokenId) => handleDelete(tokenId)}
          />
        </aside>

        {isMobileSidebarOpen ? (
          <aside className="absolute inset-y-0 left-0 z-20 w-72 border-r border-slate-200 bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900">
            <Sidebar
              selectedTokenId={selectedTokenId}
              onSelectToken={handleSelectToken}
              onCreateToken={handleCreateToken}
              onDeleteToken={(tokenId) => handleDelete(tokenId)}
            />
          </aside>
        ) : null}

        <main className="flex flex-1 flex-col xl:flex-row">
          <section className="flex-1 bg-white dark:bg-slate-800">
            <TokenEditor
              selectedToken={selectedToken}
              selectedTokenGroup={selectedTokenGroup}
              isCreateMode={isCreateMode}
              onSave={handleSaveToken}
              onCancel={handleCancel}
              onDelete={() => handleDelete()}
            />
          </section>
          <section className="w-full border-t border-slate-200 bg-slate-50 xl:w-96 xl:border-t-0 xl:border-l dark:border-slate-700 dark:bg-slate-900">
            <PreviewPanel />
          </section>
        </main>
      </div>
    </div>
  );
}
