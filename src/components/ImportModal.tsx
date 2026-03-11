import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTokenStore } from '@/store/tokenStore';
import { parseImportJson } from '@/utils/importer';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportMode = 'merge' | 'replace';

function resetFileInput(input: HTMLInputElement | null): void {
  if (!input) {
    return;
  }

  input.value = '';
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importThemes = useTokenStore((state) => state.importThemes);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPayload, setParsedPayload] = useState<ReturnType<
    typeof parseImportJson
  > | null>(null);

  const themeSummaries = useMemo(() => {
    if (!parsedPayload) {
      return [];
    }

    return parsedPayload.themes.map((theme) => {
      const colorCount = theme.tokens.filter(
        (token) => token.$type === 'color',
      ).length;
      const dimensionCount = theme.tokens.filter(
        (token) => token.$type === 'dimension',
      ).length;
      const typographyCount = theme.tokens.filter(
        (token) => token.$type === 'typography',
      ).length;

      return {
        name: theme.name,
        total: theme.tokens.length,
        colorCount,
        dimensionCount,
        typographyCount,
      };
    });
  }, [parsedPayload]);

  const clearState = () => {
    setIsDragOver(false);
    setIsReading(false);
    setMode('merge');
    setSourceFileName(null);
    setParseError(null);
    setParsedPayload(null);
    resetFileInput(fileInputRef.current);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      clearState();
    }
  };

  const parseFile = async (file: File) => {
    setIsReading(true);
    setParseError(null);

    try {
      const content = await file.text();
      const nextPayload = parseImportJson(content);
      setParsedPayload(nextPayload);
      setSourceFileName(file.name);
      toast.success('Import file parsed successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to parse file';
      setParsedPayload(null);
      setSourceFileName(file.name);
      setParseError(message);
      toast.error(message);
    } finally {
      setIsReading(false);
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    await parseFile(selectedFile);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    await parseFile(droppedFile);
  };

  const handleImport = () => {
    if (!parsedPayload) {
      return;
    }

    if (
      mode === 'replace' &&
      !window.confirm(
        'Replace will remove all existing themes and tokens. Continue?',
      )
    ) {
      return;
    }

    importThemes(parsedPayload.themes, mode);
    toast.success(
      mode === 'merge' ? 'Themes merged successfully' : 'Themes replaced',
    );
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Tokens</DialogTitle>
          <DialogDescription>
            Upload a JSON file in Tokezilla theme format or nested DTCG token
            format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileSelection}
            aria-label="Upload token JSON file"
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
            }`}
            aria-label="Drop JSON file here or click to upload"
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              Drop JSON file here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports exported theme JSON and DTCG nested token JSON.
            </p>
          </div>

          {isReading ? (
            <div
              className="space-y-2 rounded-lg border p-4"
              aria-live="polite"
              aria-label="Parsing import file"
            >
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : null}

          {sourceFileName ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="font-medium">File: {sourceFileName}</p>
              {parsedPayload ? (
                <p className="text-xs text-muted-foreground">
                  Detected format: {parsedPayload.source.toUpperCase()}
                </p>
              ) : null}
            </div>
          ) : null}

          {parseError ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
              aria-live="assertive"
            >
              {parseError}
            </p>
          ) : null}

          {parsedPayload ? (
            <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-sm font-semibold">Preview</h3>
              <ul className="space-y-2">
                {themeSummaries.map((theme) => (
                  <li
                    key={theme.name}
                    className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700"
                  >
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme.total} tokens • {theme.colorCount} colors •{' '}
                      {theme.dimensionCount} spacing • {theme.typographyCount}{' '}
                      typography
                    </p>
                  </li>
                ))}
              </ul>

              <fieldset>
                <legend className="text-sm font-medium">Import Mode</legend>
                <div className="mt-2 space-y-2">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="import-mode"
                      value="merge"
                      checked={mode === 'merge'}
                      onChange={() => setMode('merge')}
                    />
                    <span>
                      <span className="block font-medium">
                        Merge (Recommended)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Keep existing themes and add imported themes.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="import-mode"
                      value="replace"
                      checked={mode === 'replace'}
                      onChange={() => setMode('replace')}
                    />
                    <span>
                      <span className="block font-medium">Replace</span>
                      <span className="text-xs text-muted-foreground">
                        Remove existing themes and replace with imported data.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!parsedPayload || isReading}>
            {isReading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Import Tokens
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
