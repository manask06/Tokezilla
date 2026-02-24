import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenList } from '@/components/TokenList';
import { useTokenStore } from '@/store/tokenStore';
import type { Token, TokenGroup } from '@/types/tokens';

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
  const spacingTokens = tokens.filter((token) => token.$type === 'dimension');
  const typographyTokens = tokens.filter(
    (token) =>
      token.$type === 'typography' ||
      token.$type === 'fontFamily' ||
      token.$type === 'fontSize' ||
      token.$type === 'fontWeight' ||
      token.$type === 'lineHeight',
  );

  const listConfigByGroup: Record<
    TokenGroup,
    {
      tokens: Token[];
      label: string;
      placeholder: string;
      ariaLabel: string;
    }
  > = {
    colors: {
      tokens: colorTokens,
      label: 'Color Tokens',
      placeholder: 'Search colors...',
      ariaLabel: 'Search color tokens',
    },
    spacing: {
      tokens: spacingTokens,
      label: 'Spacing Tokens',
      placeholder: 'Search spacing...',
      ariaLabel: 'Search spacing tokens',
    },
    typography: {
      tokens: typographyTokens,
      label: 'Typography Tokens',
      placeholder: 'Search typography...',
      ariaLabel: 'Search typography tokens',
    },
  };
  const activeListConfig = listConfigByGroup[selectedTokenGroup];

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

      <TokenList
        tokens={activeListConfig.tokens}
        tokenLabel={activeListConfig.label}
        searchPlaceholder={activeListConfig.placeholder}
        searchAriaLabel={activeListConfig.ariaLabel}
        selectedTokenId={selectedTokenId}
        onSelectToken={onSelectToken}
        onCreateToken={onCreateToken}
        onDeleteToken={onDeleteToken}
      />
    </div>
  );
}
