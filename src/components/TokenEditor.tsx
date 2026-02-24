import { ColorTokenForm } from '@/components/forms/ColorTokenForm';
import { DimensionTokenForm } from '@/components/forms/DimensionTokenForm';
import { TypographyTokenForm } from '@/components/forms/TypographyTokenForm';
import type { Token, TokenGroup, TypographyValue } from '@/types/tokens';

type TokenEditorSavePayload =
  | {
      kind: 'color';
      name: string;
      value: string;
      description?: string | undefined;
    }
  | {
      kind: 'dimension';
      name: string;
      value: string;
      description?: string | undefined;
    }
  | {
      kind: 'typography';
      name: string;
      value: TypographyValue;
      description?: string | undefined;
    };

interface TokenEditorProps {
  selectedToken: Token | null;
  selectedTokenGroup: TokenGroup;
  isCreateMode: boolean;
  onSave: (values: TokenEditorSavePayload) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function resolveEditorKind(
  selectedTokenGroup: TokenGroup,
  selectedToken: Token | null,
): TokenEditorSavePayload['kind'] {
  if (selectedToken) {
    if (selectedToken.$type === 'color') {
      return 'color';
    }
    if (selectedToken.$type === 'dimension') {
      return 'dimension';
    }
    return 'typography';
  }

  if (selectedTokenGroup === 'colors') {
    return 'color';
  }
  if (selectedTokenGroup === 'spacing') {
    return 'dimension';
  }
  return 'typography';
}

export function TokenEditor({
  selectedToken,
  selectedTokenGroup,
  isCreateMode,
  onSave,
  onCancel,
  onDelete,
}: TokenEditorProps) {
  const editorKind = resolveEditorKind(selectedTokenGroup, selectedToken);

  return (
    <section className="h-full p-4 md:p-6">
      <h2 className="text-xl font-semibold">Token Editor</h2>

      <div className="mt-4 rounded-lg border bg-card p-4">
        {selectedToken || isCreateMode ? (
          <>
            {editorKind === 'color' ? (
              <ColorTokenForm
                token={selectedToken ?? undefined}
                isCreateMode={isCreateMode}
                onSave={(values) =>
                  onSave({
                    kind: 'color',
                    name: values.name,
                    value: values.value,
                    description: values.description,
                  })
                }
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ) : null}

            {editorKind === 'dimension' ? (
              <DimensionTokenForm
                token={selectedToken ?? undefined}
                isCreateMode={isCreateMode}
                onSave={(values) =>
                  onSave({
                    kind: 'dimension',
                    name: values.name,
                    value: values.value,
                    description: values.description,
                  })
                }
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ) : null}

            {editorKind === 'typography' ? (
              <TypographyTokenForm
                token={selectedToken ?? undefined}
                isCreateMode={isCreateMode}
                onSave={(values) => {
                  const typographyValue = {
                    ...(values.fontFamily
                      ? { fontFamily: values.fontFamily }
                      : {}),
                    ...(values.fontSize ? { fontSize: values.fontSize } : {}),
                    ...(values.fontWeight
                      ? { fontWeight: Number.parseInt(values.fontWeight, 10) }
                      : {}),
                    ...(values.lineHeight
                      ? { lineHeight: values.lineHeight }
                      : {}),
                  };

                  onSave({
                    kind: 'typography',
                    name: values.name,
                    value: typographyValue,
                    description: values.description,
                  });
                }}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-muted-foreground dark:border-slate-700">
            Select a token or create a new one
          </div>
        )}
      </div>
    </section>
  );
}
