import { ColorTokenForm } from '@/components/forms/ColorTokenForm';
import type { Token } from '@/types/tokens';

interface TokenEditorProps {
  selectedToken: Token | null;
  isCreateMode: boolean;
  onSave: (values: {
    name: string;
    value: string;
    description?: string | undefined;
  }) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function TokenEditor({
  selectedToken,
  isCreateMode,
  onSave,
  onCancel,
  onDelete,
}: TokenEditorProps) {
  return (
    <section className="h-full p-4 md:p-6">
      <h2 className="text-xl font-semibold">Token Editor</h2>

      <div className="mt-4 rounded-lg border bg-card p-4">
        {selectedToken || isCreateMode ? (
          <ColorTokenForm
            token={selectedToken ?? undefined}
            isCreateMode={isCreateMode}
            onSave={onSave}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-muted-foreground dark:border-slate-700">
            Select a token or create a new one
          </div>
        )}
      </div>
    </section>
  );
}
