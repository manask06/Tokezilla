import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTokenStore } from '@/store/tokenStore';
import type { Token, TokenGroup } from '@/types/tokens';

const tokenFilterByGroup: Record<TokenGroup, (token: Token) => boolean> = {
  colors: (token) => token.$type === 'color',
  spacing: (token) => token.$type === 'dimension',
  typography: (token) =>
    token.$type === 'fontFamily' ||
    token.$type === 'fontSize' ||
    token.$type === 'fontWeight' ||
    token.$type === 'lineHeight' ||
    token.$type === 'letterSpacing',
};

export function Sidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const tokens = useTokenStore((state) => state.tokens);
  const selectedTokenGroup = useTokenStore((state) => state.selectedTokenGroup);
  const setSelectedTokenGroup = useTokenStore(
    (state) => state.setSelectedTokenGroup,
  );
  const addToken = useTokenStore((state) => state.addToken);

  const visibleTokens = useMemo(
    () =>
      tokens
        .filter(tokenFilterByGroup[selectedTokenGroup])
        .filter((token) =>
          token.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    [searchTerm, selectedTokenGroup, tokens],
  );

  const handleAddDummyToken = () => {
    addToken({
      name: `primary-${tokens.length + 1}`,
      $value: '#2563eb',
      $type: 'color',
      $description: 'Dummy token for persistence test',
    });
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Tokens</h2>
        <p className="text-sm text-muted-foreground">{tokens.length} tokens</p>
      </div>

      <div className="mt-4 space-y-3">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search tokens..."
          aria-label="Search tokens"
        />

        <Tabs
          value={selectedTokenGroup}
          onValueChange={(value) => setSelectedTokenGroup(value as TokenGroup)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-md border bg-background p-3">
        {tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tokens yet. Create your first token!
          </p>
        ) : visibleTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tokens in this group yet.
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Token list">
            {visibleTokens.map((token) => (
              <li
                key={token.id}
                className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="font-medium">{token.name}</p>
                <p className="text-xs text-muted-foreground">{token.$type}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Button className="w-full" variant="default">
          + New Token
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={handleAddDummyToken}
        >
          Add Dummy Token
        </Button>
      </div>
    </div>
  );
}
