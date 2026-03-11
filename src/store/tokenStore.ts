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
  renameTheme: (themeId: string, name: string) => void;
  duplicateTheme: (themeId: string, nextName?: string) => void;
  deleteTheme: (themeId: string) => void;
  switchTheme: (themeId: string) => void;
  importThemes: (
    themes: Array<{
      name: string;
      isDefault?: boolean;
      tokens: Omit<Token, 'id'>[];
    }>,
    mode: 'merge' | 'replace',
  ) => void;
  setSelectedTokenGroup: (group: TokenGroup) => void;
}

function createUniqueThemeName(
  baseName: string,
  usedNames: Set<string>,
): string {
  const normalized = baseName.trim() || 'Imported Theme';
  let candidate = normalized;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${normalized} ${suffix}`;
    suffix += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function buildThemeSet(
  payload: {
    name: string;
    isDefault?: boolean;
    tokens: Omit<Token, 'id'>[];
  },
  usedNames: Set<string>,
): ThemeSet {
  const name = createUniqueThemeName(payload.name, usedNames);
  const tokens = payload.tokens.map((token) => ({
    ...token,
    id: crypto.randomUUID(),
  }));

  return {
    id: crypto.randomUUID(),
    name,
    isDefault: Boolean(payload.isDefault),
    tokens,
  };
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

      renameTheme: (themeId, name) =>
        set((state) => ({
          themes: state.themes.map((theme) =>
            theme.id === themeId ? { ...theme, name } : theme,
          ),
        })),

      duplicateTheme: (themeId, nextName) =>
        set((state) => {
          const baseTheme = state.themes.find((theme) => theme.id === themeId);
          if (!baseTheme) {
            return state;
          }

          const duplicatedTheme: ThemeSet = {
            ...baseTheme,
            id: crypto.randomUUID(),
            name: nextName?.trim() || `${baseTheme.name} Copy`,
            isDefault: false,
            tokens: baseTheme.tokens.map((token) => ({ ...token })),
          };

          return {
            themes: [...state.themes, duplicatedTheme],
          };
        }),

      deleteTheme: (themeId) =>
        set((state) => {
          const themeToDelete = state.themes.find(
            (theme) => theme.id === themeId,
          );
          if (
            !themeToDelete ||
            themeToDelete.isDefault ||
            state.themes.length <= 1
          ) {
            return state;
          }

          const nextThemes = state.themes.filter(
            (theme) => theme.id !== themeId,
          );
          if (state.activeThemeId !== themeId) {
            return { themes: nextThemes };
          }

          const fallbackTheme = nextThemes[0];
          if (!fallbackTheme) {
            return state;
          }

          return {
            themes: nextThemes,
            activeThemeId: fallbackTheme.id,
            tokens: fallbackTheme.tokens,
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

      importThemes: (themes, mode) =>
        set((state) => {
          if (themes.length === 0) {
            return state;
          }

          if (mode === 'replace') {
            const usedNames = new Set<string>();
            const replacementThemes = themes.map((theme) =>
              buildThemeSet(theme, usedNames),
            );
            if (replacementThemes.length === 0) {
              return state;
            }

            const hasDefaultTheme = replacementThemes.some(
              (theme) => theme.isDefault,
            );
            if (!hasDefaultTheme) {
              const firstTheme = replacementThemes[0];
              if (!firstTheme) {
                return state;
              }
              firstTheme.isDefault = true;
            }

            const activeTheme =
              replacementThemes.find((theme) => theme.isDefault) ??
              replacementThemes[0];
            if (!activeTheme) {
              return state;
            }

            return {
              themes: replacementThemes,
              activeThemeId: activeTheme.id,
              tokens: activeTheme.tokens,
            };
          }

          const usedNames = new Set(
            state.themes.map((theme) => theme.name.toLowerCase()),
          );
          const mergedThemes = themes.map((theme) => {
            const nextTheme = buildThemeSet(theme, usedNames);
            return {
              ...nextTheme,
              isDefault: false,
            };
          });

          return {
            themes: [...state.themes, ...mergedThemes],
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
