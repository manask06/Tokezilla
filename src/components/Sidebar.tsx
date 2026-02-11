import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenList } from '@/components/TokenList';
import { useTokenStore } from '@/store/tokenStore';
import type { TokenGroup } from '@/types/tokens';

interface SidebarProps {
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string) => void;
  onCreateToken: () => void;
  onDeleteToken: (tokenId: string) => void;
}

export function Sidebar({
  selectedTokenId,
  onSelectToken,
  onCreateToken,
  onDeleteToken,
}: SidebarProps) {
  const tokens = useTokenStore((state) => state.tokens);
  const selectedTokenGroup = useTokenStore((state) => state.selectedTokenGroup);
  const setSelectedTokenGroup = useTokenStore(
    (state) => state.setSelectedTokenGroup,
  );

  const colorTokens = tokens.filter((token) => token.$type === 'color');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-3 dark:border-slate-700">
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

      {selectedTokenGroup === 'colors' ? (
        <TokenList
          tokens={colorTokens}
          selectedTokenId={selectedTokenId}
          onSelectToken={onSelectToken}
          onCreateToken={onCreateToken}
          onDeleteToken={onDeleteToken}
        />
      ) : (
        <div className="p-4 text-sm text-muted-foreground">
          This module currently supports color token management.
        </div>
      )}
    </div>
  );
}
