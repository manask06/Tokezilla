import { useEffect, useMemo, useState } from 'react';
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
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string) => void;
  onCreateToken: () => void;
  onDeleteToken: (tokenId: string) => void;
}

function getTokenColor(token: Token): string {
  return typeof token.$value === 'string' ? token.$value : '#94a3b8';
}

export function TokenList({
  tokens,
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

  return (
    <div className="flex h-full flex-col p-4">
      <div>
        <h2 className="text-lg font-semibold">Color Tokens</h2>
        <p className="text-sm text-muted-foreground">{tokens.length} tokens</p>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="pl-9"
          placeholder="Search by token name..."
          aria-label="Search color tokens"
        />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-md border bg-background p-2">
        {filteredTokens.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted-foreground dark:border-slate-700">
            No color tokens yet. Create your first token!
          </div>
        ) : (
          <ul className="space-y-1" aria-label="Color token list">
            {filteredTokens.map((token) => {
              const isActive = selectedTokenId === token.id;

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
                        className="size-6 rounded-full border border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: getTokenColor(token) }}
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
