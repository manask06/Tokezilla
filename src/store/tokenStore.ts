import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemeSet, Token, TokenGroup } from '@/types/tokens';

const DEFAULT_THEME_ID = 'light-theme';

const defaultTheme: ThemeSet = {
  id: DEFAULT_THEME_ID,
  name: 'Light',
  isDefault: true,
  tokens: [],
};

interface TokenStoreState {
  tokens: Token[];
  themes: ThemeSet[];
  activeThemeId: string;
  selectedTokenGroup: TokenGroup;
  addToken: (token: Omit<Token, 'id'>) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  deleteToken: (id: string) => void;
  createTheme: (name: string) => void;
  switchTheme: (themeId: string) => void;
  setSelectedTokenGroup: (group: TokenGroup) => void;
}

const withUpdatedActiveTheme = (
  themes: ThemeSet[],
  activeThemeId: string,
  nextTokens: Token[],
): ThemeSet[] =>
  themes.map((theme) =>
    theme.id === activeThemeId ? { ...theme, tokens: nextTokens } : theme,
  );

export const useTokenStore = create<TokenStoreState>()(
  persist(
    (set) => ({
      tokens: defaultTheme.tokens,
      themes: [defaultTheme],
      activeThemeId: defaultTheme.id,
      selectedTokenGroup: 'colors',

      addToken: (token) =>
        set((state) => {
          const nextToken: Token = { ...token, id: crypto.randomUUID() };
          const nextTokens = [...state.tokens, nextToken];

          return {
            tokens: nextTokens,
            themes: withUpdatedActiveTheme(
              state.themes,
              state.activeThemeId,
              nextTokens,
            ),
          };
        }),

      updateToken: (id, updates) =>
        set((state) => {
          const nextTokens = state.tokens.map((token) =>
            token.id === id ? { ...token, ...updates } : token,
          );

          return {
            tokens: nextTokens,
            themes: withUpdatedActiveTheme(
              state.themes,
              state.activeThemeId,
              nextTokens,
            ),
          };
        }),

      deleteToken: (id) =>
        set((state) => {
          const nextTokens = state.tokens.filter((token) => token.id !== id);

          return {
            tokens: nextTokens,
            themes: withUpdatedActiveTheme(
              state.themes,
              state.activeThemeId,
              nextTokens,
            ),
          };
        }),

      createTheme: (name) =>
        set((state) => {
          const newTheme: ThemeSet = {
            id: crypto.randomUUID(),
            name,
            isDefault: false,
            tokens: [],
          };

          return {
            themes: [...state.themes, newTheme],
          };
        }),

      switchTheme: (themeId) =>
        set((state) => {
          const selectedTheme = state.themes.find(
            (theme) => theme.id === themeId,
          );
          if (!selectedTheme) {
            return state;
          }

          return {
            activeThemeId: themeId,
            tokens: selectedTheme.tokens,
          };
        }),

      setSelectedTokenGroup: (group) =>
        set(() => ({
          selectedTokenGroup: group,
        })),
    }),
    {
      name: 'tokezilla-token-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        themes: state.themes,
        activeThemeId: state.activeThemeId,
        selectedTokenGroup: state.selectedTokenGroup,
      }),
    },
  ),
);
