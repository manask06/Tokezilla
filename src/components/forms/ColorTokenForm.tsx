import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { HexColorPicker } from 'react-colorful';
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

const tokenNameRegex = /^[a-zA-Z0-9_-]+$/;
const hexRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const rgbRegex =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const hslRegex =
  /^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;

const colorTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(tokenNameRegex, 'Use letters, numbers, dash, or underscore only'),
  value: z
    .string()
    .min(1, 'Color value is required')
    .refine(
      (value) =>
        hexRegex.test(value) || rgbRegex.test(value) || hslRegex.test(value),
      'Use a valid HEX, RGB, or HSL color',
    ),
  description: z.string().optional(),
});

type ColorTokenFormValues = z.infer<typeof colorTokenSchema>;

interface ColorTokenFormProps {
  token: Token | undefined;
  isCreateMode: boolean;
  onSave: (values: ColorTokenFormValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function normalizeCssColorToHex(colorValue: string): string | null {
  if (hexRegex.test(colorValue)) {
    if (colorValue.length === 4) {
      const r = colorValue[1];
      const g = colorValue[2];
      const b = colorValue[3];

      if (!r || !g || !b) {
        return null;
      }

      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }

    if (colorValue.length === 9) {
      return colorValue.slice(0, 7).toUpperCase();
    }

    return colorValue.toUpperCase();
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const probe = document.createElement('div');
  probe.style.color = colorValue;

  if (!probe.style.color) {
    return null;
  }

  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const rgbMatch = computed.match(
    /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\)$/,
  );

  if (!rgbMatch) {
    return null;
  }

  const redChannel = rgbMatch[1];
  const greenChannel = rgbMatch[2];
  const blueChannel = rgbMatch[3];
  if (!redChannel || !greenChannel || !blueChannel) {
    return null;
  }

  const red = Number.parseInt(redChannel, 10);
  const green = Number.parseInt(greenChannel, 10);
  const blue = Number.parseInt(blueChannel, 10);

  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function ColorTokenForm({
  token,
  isCreateMode,
  onSave,
  onCancel,
  onDelete,
}: ColorTokenFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const form = useForm<ColorTokenFormValues>({
    resolver: zodResolver(colorTokenSchema),
    defaultValues: {
      name: '',
      value: '#2563EB',
      description: '',
    },
  });

  useEffect(() => {
    form.reset({
      name: token?.name ?? '',
      value: typeof token?.$value === 'string' ? token.$value : '#2563EB',
      description: token?.$description ?? '',
    });
  }, [form, token]);

  const currentValue = useWatch({ control: form.control, name: 'value' }) ?? '';
  const pickerHexValue = useMemo(
    () => normalizeCssColorToHex(currentValue) ?? '#2563EB',
    [currentValue],
  );

  const handleSubmit = form.handleSubmit((values) => {
    onSave(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="token-name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <Input
          id="token-name"
          {...form.register('name')}
          placeholder="brand_primary"
        />
        {form.formState.errors.name ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="token-value" className="mb-1 block text-sm font-medium">
          Color Value
        </label>
        <div className="mb-3 flex items-center gap-3">
          <span
            className="size-10 rounded-full border border-slate-300 dark:border-slate-600"
            style={{ backgroundColor: pickerHexValue }}
            aria-label="Live color preview"
          />
          <HexColorPicker
            color={pickerHexValue}
            onChange={(hexValue) => {
              form.setValue('value', hexValue, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>
        <Input
          id="token-value"
          {...form.register('value')}
          placeholder="#2563EB"
        />
        {form.formState.errors.value ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.value.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="token-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <Textarea
          id="token-description"
          {...form.register('description')}
          placeholder="Used for primary actions"
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
