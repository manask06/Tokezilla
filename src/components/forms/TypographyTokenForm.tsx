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
import type { Token } from '@/types/tokens';
import { isTokenReference } from '@/utils/tokenResolver';

const tokenNameRegex = /^[a-zA-Z0-9_.-]+$/;
const referenceTokenRegex = /^\{[a-zA-Z0-9_.-]+\}$/;
const sizeRegex = /^-?(?:\d+|\d*\.\d+)(?:px|rem|em|%)$/;
const lineHeightRegex = /^(?:normal|-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|))$/;

const typographyTokenSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .regex(tokenNameRegex, 'Use letters, numbers, dash, or underscore only'),
    fontFamily: z.string().optional(),
    fontSize: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value || sizeRegex.test(value) || referenceTokenRegex.test(value),
        {
          message: 'Use value like 16px, 1rem, or 100%',
        },
      ),
    fontWeight: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{3}$/.test(value), {
        message: 'Use numeric weight like 400, 500, 700',
      }),
    lineHeight: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value ||
          lineHeightRegex.test(value) ||
          referenceTokenRegex.test(value),
        {
          message: 'Use normal, 1.5, 24px, or 150%',
        },
      ),
    description: z.string().optional(),
  })
  .refine(
    (values) =>
      Boolean(
        values.fontFamily ||
        values.fontSize ||
        values.fontWeight ||
        values.lineHeight,
      ),
    {
      message: 'Add at least one typography property',
      path: ['fontFamily'],
    },
  );

type TypographyTokenFormValues = z.infer<typeof typographyTokenSchema>;

interface TypographyTokenFormProps {
  token: Token | undefined;
  isCreateMode: boolean;
  onSave: (values: TypographyTokenFormValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function TypographyTokenForm({
  token,
  isCreateMode,
  onSave,
  onCancel,
  onDelete,
}: TypographyTokenFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const form = useForm<TypographyTokenFormValues>({
    resolver: zodResolver(typographyTokenSchema),
    defaultValues: {
      name: '',
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
      description: '',
    },
  });

  useEffect(() => {
    const isTypographyToken = token?.$type === 'typography';
    const tokenValue =
      isTypographyToken &&
      token &&
      typeof token.$value === 'object' &&
      token.$value !== null
        ? token.$value
        : {};

    form.reset({
      name: token?.name ?? '',
      fontFamily:
        typeof tokenValue.fontFamily === 'string'
          ? tokenValue.fontFamily
          : 'Inter',
      fontSize:
        typeof tokenValue.fontSize === 'string' ? tokenValue.fontSize : '16px',
      fontWeight:
        typeof tokenValue.fontWeight === 'number'
          ? String(tokenValue.fontWeight)
          : '400',
      lineHeight:
        typeof tokenValue.lineHeight === 'string'
          ? tokenValue.lineHeight
          : '1.5',
      description: token?.$description ?? '',
    });
  }, [form, token]);

  const watchedFontSize =
    useWatch({ control: form.control, name: 'fontSize' }) ?? '';
  const watchedLineHeight =
    useWatch({ control: form.control, name: 'lineHeight' }) ?? '';

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <div>
        <label
          htmlFor="typography-name"
          className="mb-1 block text-sm font-medium"
        >
          Name
        </label>
        <Input
          id="typography-name"
          {...form.register('name')}
          placeholder="body_base"
        />
        {form.formState.errors.name ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="typography-family"
            className="mb-1 block text-sm font-medium"
          >
            Font Family
          </label>
          <Input id="typography-family" {...form.register('fontFamily')} />
        </div>
        <div>
          <label
            htmlFor="typography-size"
            className="mb-1 block text-sm font-medium"
          >
            Font Size
          </label>
          <Input id="typography-size" {...form.register('fontSize')} />
          {isTokenReference(watchedFontSize) ? (
            <p className="mt-1 text-xs text-muted-foreground">
              → {watchedFontSize}
            </p>
          ) : null}
          {form.formState.errors.fontSize ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.fontSize.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="typography-weight"
            className="mb-1 block text-sm font-medium"
          >
            Font Weight
          </label>
          <Input id="typography-weight" {...form.register('fontWeight')} />
          {form.formState.errors.fontWeight ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.fontWeight.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="typography-line-height"
            className="mb-1 block text-sm font-medium"
          >
            Line Height
          </label>
          <Input id="typography-line-height" {...form.register('lineHeight')} />
          {isTokenReference(watchedLineHeight) ? (
            <p className="mt-1 text-xs text-muted-foreground">
              → {watchedLineHeight}
            </p>
          ) : null}
          {form.formState.errors.lineHeight ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.lineHeight.message}
            </p>
          ) : null}
        </div>
      </div>

      {form.formState.errors.fontFamily?.message ? (
        <p className="text-xs text-red-600">
          {form.formState.errors.fontFamily.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="typography-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id="typography-description"
          {...form.register('description')}
          placeholder="Typography style for body text"
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
