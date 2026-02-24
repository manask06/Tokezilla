import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { Token } from '@/types/tokens';

const tokenNameRegex = /^[a-zA-Z0-9_-]+$/;
const dimensionValueRegex = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw)$/;

const dimensionTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(tokenNameRegex, 'Use letters, numbers, dash, or underscore only'),
  value: z
    .string()
    .min(1, 'Value is required')
    .regex(dimensionValueRegex, 'Use value like 16px, 2rem, 100%, 50vh'),
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
  const form = useForm<DimensionTokenFormValues>({
    resolver: zodResolver(dimensionTokenSchema),
    defaultValues: {
      name: '',
      value: '16px',
      description: '',
    },
  });

  useEffect(() => {
    form.reset({
      name: token?.name ?? '',
      value: typeof token?.$value === 'string' ? token.$value : '16px',
      description: token?.$description ?? '',
    });
  }, [form, token]);

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
        <Input
          id="dimension-value"
          {...form.register('value')}
          placeholder="16px"
        />
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
