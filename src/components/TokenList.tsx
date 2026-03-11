import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Token } from '@/types/tokens';

interface TokenListProps {
  tokens: Token[];
  tokenLabel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string) => void;
  onCreateToken: () => void;
  onDeleteToken: (tokenId: string) => void;
}

function getTokenVisual(token: Token): { style: CSSProperties; shape: string } {
  if (token.$type === 'color') {
    return {
      style: {
        backgroundColor:
          typeof token.$value === 'string' ? token.$value : '#94a3b8',
      },
      shape: 'rounded-full',
    };
  }

  if (token.$type === 'dimension') {
    const dimensionValue =
      typeof token.$value === 'string' ? token.$value : '16px';
    return {
      style: {
        width: '24px',
        height: '12px',
        backgroundColor: '#0f172a',
        transform: `scaleX(${Math.min(1.5, Number.parseFloat(dimensionValue) / 16 || 1)})`,
      },
      shape: 'rounded-sm',
    };
  }

  return {
    style: {
      background:
        'linear-gradient(135deg, rgb(30 41 59) 0%, rgb(71 85 105) 50%, rgb(148 163 184) 100%)',
    },
    shape: 'rounded-md',
  };
}

export function TokenList({
  tokens,
  tokenLabel,
  searchPlaceholder,
  searchAriaLabel,
  selectedTokenId,
  onSelectToken,
  onCreateToken,
  onDeleteToken,
}: TokenListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tokenPendingDelete, setTokenPendingDelete] = useState<Token | null>(
    null,
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const filteredTokens = useMemo(
    () =>
      tokens.filter((token) =>
        token.name.toLowerCase().includes(debouncedSearch),
      ),
    [debouncedSearch, tokens],
  );
  const hasSearch = debouncedSearch.length > 0;

  return (
    <div className="flex h-full flex-col p-4">
      <div>
        <h2 className="text-lg font-semibold">{tokenLabel}</h2>
        <p className="text-sm text-muted-foreground">{tokens.length} tokens</p>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="pl-9"
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
        />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-md border bg-background p-2">
        {filteredTokens.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted-foreground dark:border-slate-700">
            {hasSearch
              ? 'No tokens match this search.'
              : 'No tokens yet. Create your first token!'}
          </div>
        ) : (
          <ul className="space-y-1" aria-label={`${tokenLabel} list`}>
            {filteredTokens.map((token) => {
              const isActive = selectedTokenId === token.id;
              const visual = getTokenVisual(token);

              return (
                <li key={token.id}>
                  <div
                    className={`group flex items-center justify-between rounded-md border px-2 py-2 transition-colors ${
                      isActive
                        ? 'border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectToken(token.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`size-6 border border-slate-300 dark:border-slate-600 ${visual.shape}`}
                        style={visual.style}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">
                        {token.name}
                      </span>
                    </button>

                    <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onSelectToken(token.id)}
                        aria-label={`Edit ${token.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-600 hover:text-red-700"
                        onClick={() => setTokenPendingDelete(token)}
                        aria-label={`Delete ${token.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Button className="mt-4 w-full" onClick={onCreateToken}>
        + New Token
      </Button>

      <Dialog
        open={tokenPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTokenPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete token?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTokenPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (tokenPendingDelete) {
                  onDeleteToken(tokenPendingDelete.id);
                }
                setTokenPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
