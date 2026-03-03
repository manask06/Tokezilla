import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useTokenStore } from '@/store/tokenStore';
import type { Token } from '@/types/tokens';
import { extractReferenceName, isTokenReference } from '@/utils/tokenResolver';

const tokenNameRegex = /^[a-zA-Z0-9_.-]+$/;
const dimensionValueRegex = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw)$/;
const referenceTokenRegex = /^\{[a-zA-Z0-9_.-]+\}$/;

const dimensionTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(tokenNameRegex, 'Use letters, numbers, dash, or underscore only'),
  value: z
    .string()
    .min(1, 'Value is required')
    .refine(
      (value) =>
        dimensionValueRegex.test(value) || referenceTokenRegex.test(value),
      'Use value like 16px, 2rem, 100%, 50vh or {token.name}',
    ),
  description: z.string().optional(),
});

type DimensionTokenFormValues = z.infer<typeof dimensionTokenSchema>;

interface DimensionTokenFormProps {
  token: Token | undefined;
  isCreateMode: boolean;
  onSave: (values: DimensionTokenFormValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function DimensionTokenForm({
  token,
  isCreateMode,
  onSave,
  onCancel,
  onDelete,
}: DimensionTokenFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const tokens = useTokenStore((state) => state.tokens);
  const form = useForm<DimensionTokenFormValues>({
    resolver: zodResolver(dimensionTokenSchema),
    defaultValues: {
      name: '',
      value: '16px',
      description: '',
    },
  });

  useEffect(() => {
    const initialValue =
      typeof token?.$value === 'string' ? token.$value : '16px';
    form.reset({
      name: token?.name ?? '',
      value: initialValue,
      description: token?.$description ?? '',
    });
  }, [form, token]);

  const currentValue = useWatch({ control: form.control, name: 'value' }) ?? '';
  const isReference = isTokenReference(currentValue);
  const referenceInput = extractReferenceName(currentValue) ?? '';
  const referenceCandidates = tokens
    .filter((item) => item.id !== token?.id)
    .map((item) => item.name);

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <div>
        <label
          htmlFor="dimension-name"
          className="mb-1 block text-sm font-medium"
        >
          Name
        </label>
        <Input
          id="dimension-name"
          {...form.register('name')}
          placeholder="spacing_md"
        />
        {form.formState.errors.name ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="dimension-value"
          className="mb-1 block text-sm font-medium"
        >
          Value
        </label>
        <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isReference}
            onChange={(event) => {
              const enabled = event.target.checked;
              if (enabled) {
                const nextReference =
                  referenceInput || referenceCandidates[0] || '';
                form.setValue(
                  'value',
                  nextReference ? `{${nextReference}}` : '',
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
              } else if (isTokenReference(currentValue)) {
                form.setValue('value', '16px', {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          />
          Reference Token
        </label>
        {isReference ? (
          <div className="space-y-2">
            <Input
              list="dimension-token-reference-options"
              placeholder="spacing.md"
              value={referenceInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                form.setValue('value', nextValue ? `{${nextValue}}` : '', {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <datalist id="dimension-token-reference-options">
              {referenceCandidates.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        ) : (
          <Input
            id="dimension-value"
            {...form.register('value')}
            placeholder="16px"
          />
        )}
        {isReference ? (
          <p className="mt-1 text-xs text-muted-foreground">→ {currentValue}</p>
        ) : null}
        {form.formState.errors.value ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.value.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="dimension-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id="dimension-description"
          {...form.register('description')}
          placeholder="Used for medium spacing"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit">
          {isCreateMode ? 'Save Token' : 'Update Token'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {!isCreateMode ? (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        ) : null}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this token?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
