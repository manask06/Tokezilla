import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Check, ClipboardCopy, Download } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTokenStore } from '@/store/tokenStore';
import { buildExportFiles } from '@/utils/exporters';
import {
  toFileSlug,
  toKebabCase,
  toPascalCase,
} from '@/utils/exporters/shared';
import type {
  ExportFile,
  ExportLanguage,
  ExportPlatform,
} from '@/utils/exporters/types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlatformOption {
  id: ExportPlatform;
  label: string;
  description: string;
}

interface PlatformPreview {
  platform: ExportPlatform;
  label: string;
  files: ExportFile[];
  language: ExportLanguage;
  content: string;
}

type PlatformSelection = Record<ExportPlatform, boolean>;

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: 'css',
    label: 'CSS Variables',
    description: 'Export as :root custom properties.',
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    description: 'Generate a theme.extend config object.',
  },
  {
    id: 'ios',
    label: 'iOS',
    description: 'Swift constants and UIColor mappings.',
  },
  {
    id: 'android',
    label: 'Android',
    description: 'colors.xml and dimens.xml resource files.',
  },
  {
    id: 'json',
    label: 'JSON (DTCG)',
    description: 'Nested W3C DTCG-compatible token JSON.',
  },
];

function createDefaultSelection(): PlatformSelection {
  return {
    css: true,
    tailwind: true,
    ios: true,
    android: true,
    json: true,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function highlightCode(content: string, language: ExportLanguage): string {
  let html = escapeHtml(content);

  const stringPattern = /(&quot;[^&]*&quot;)/g;
  const keywordPattern =
    /\b(import|export|const|let|var|public|enum|struct|extension|return|static|type|interface|if|else|for|while|true|false|null)\b/g;

  html = html.replace(
    stringPattern,
    '<span class="text-emerald-300">$1</span>',
  );
  html = html.replace(keywordPattern, '<span class="text-sky-300">$1</span>');

  if (language === 'xml') {
    html = html.replace(
      /(&lt;\/?[^&]*?&gt;)/g,
      '<span class="text-fuchsia-300">$1</span>',
    );
  }

  if (language === 'css') {
    html = html.replace(
      /(--[a-zA-Z0-9-_]+)/g,
      '<span class="text-cyan-300">$1</span>',
    );
  }

  return html;
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPlatformPreviews(files: ExportFile[]): PlatformPreview[] {
  return PLATFORM_OPTIONS.map((platform) => {
    const platformFiles = files.filter((file) => file.platform === platform.id);
    if (platformFiles.length === 0) {
      return null;
    }

    if (platformFiles.length === 1) {
      const single = platformFiles[0];
      if (!single) {
        return null;
      }

      return {
        platform: platform.id,
        label: platform.label,
        files: platformFiles,
        language: single.language,
        content: single.content,
      };
    }

    const bundleContent = platformFiles
      .map((file) => `// File: ${file.path}\n${file.content}`)
      .join('\n\n');

    return {
      platform: platform.id,
      label: `${platform.label} (${platformFiles.length} files)`,
      files: platformFiles,
      language: 'text',
      content: bundleContent,
    };
  }).filter((preview): preview is PlatformPreview => preview !== null);
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const themes = useTokenStore((state) => state.themes);
  const activeThemeId = useTokenStore((state) => state.activeThemeId);
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId);
  const [platformSelection, setPlatformSelection] = useState<PlatformSelection>(
    createDefaultSelection,
  );
  const [activePreviewTab, setActivePreviewTab] =
    useState<ExportPlatform>('css');

  const handleOpenStateChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedThemeId(activeThemeId);
    }

    onOpenChange(nextOpen);
  };

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) ?? null,
    [selectedThemeId, themes],
  );

  const selectedPlatforms = useMemo(
    () =>
      PLATFORM_OPTIONS.filter((option) => platformSelection[option.id]).map(
        (option) => option.id,
      ),
    [platformSelection],
  );

  const { exportFiles, exportError } = useMemo(() => {
    if (!selectedTheme) {
      return {
        exportFiles: [] as ExportFile[],
        exportError: 'Theme not found.',
      };
    }

    if (selectedPlatforms.length === 0) {
      return { exportFiles: [] as ExportFile[], exportError: null };
    }

    try {
      return {
        exportFiles: buildExportFiles(
          selectedTheme.name,
          selectedTheme.tokens,
          selectedPlatforms,
        ),
        exportError: null,
      };
    } catch (error) {
      return {
        exportFiles: [] as ExportFile[],
        exportError:
          error instanceof Error
            ? error.message
            : 'Unable to resolve aliases for export.',
      };
    }
  }, [selectedPlatforms, selectedTheme]);

  const previews = useMemo(
    () => buildPlatformPreviews(exportFiles),
    [exportFiles],
  );

  const effectivePreviewTab = useMemo(() => {
    const hasActivePreview = previews.some(
      (preview) => preview.platform === activePreviewTab,
    );
    if (hasActivePreview) {
      return activePreviewTab;
    }

    const firstPreview = previews[0];
    return firstPreview ? firstPreview.platform : 'css';
  }, [activePreviewTab, previews]);

  const activePreview = useMemo(
    () =>
      previews.find((preview) => preview.platform === effectivePreviewTab) ??
      null,
    [effectivePreviewTab, previews],
  );

  const highlightedPreview = useMemo(() => {
    if (!activePreview) {
      return '';
    }

    return highlightCode(activePreview.content, activePreview.language);
  }, [activePreview]);

  const hasFiles = exportFiles.length > 0;

  const handleTogglePlatform = (platform: ExportPlatform, checked: boolean) => {
    setPlatformSelection((current) => ({
      ...current,
      [platform]: checked,
    }));
  };

  const handleCopy = async () => {
    if (!activePreview) {
      toast.error('Nothing to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(activePreview.content);
      toast.success('Export snippet copied.');
    } catch {
      toast.error('Clipboard copy failed.');
    }
  };

  const handleDownloadCurrent = () => {
    if (!activePreview) {
      toast.error('No export file selected.');
      return;
    }

    if (activePreview.files.length === 1) {
      const file = activePreview.files[0];
      if (!file) {
        return;
      }

      const blob = new Blob([file.content], {
        type: 'text/plain;charset=utf-8',
      });
      const filename =
        file.path.split('/').at(-1) ?? `${activePreview.platform}.txt`;
      downloadBlob(blob, filename);
      toast.success('File downloaded.');
      return;
    }

    const fallbackFileName = `${toKebabCase(activePreview.label)}.txt`;
    const blob = new Blob([activePreview.content], {
      type: 'text/plain;charset=utf-8',
    });
    downloadBlob(blob, fallbackFileName);
    toast.success('Bundle preview downloaded.');
  };

  const handleDownloadZip = async () => {
    if (!selectedTheme) {
      toast.error('Select a theme first.');
      return;
    }

    if (!hasFiles) {
      toast.error('Select at least one platform.');
      return;
    }

    try {
      const zip = new JSZip();
      for (const file of exportFiles) {
        zip.file(file.path, file.content);
      }

      const archive = await zip.generateAsync({ type: 'blob' });
      downloadBlob(
        archive,
        `${toFileSlug(selectedTheme.name)}-exports-${toPascalCase(selectedTheme.name)}.zip`,
      );
      toast.success('ZIP downloaded.');
    } catch {
      toast.error('ZIP generation failed.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenStateChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Export Tokens</DialogTitle>
          <DialogDescription>
            Generate platform artifacts with aliases resolved against the
            selected theme.
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[280px_1fr]">
          <section
            className="space-y-4 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            aria-label="Export settings"
          >
            <div>
              <p className="mb-2 text-sm font-semibold">Theme</p>
              <Select
                value={selectedThemeId}
                onValueChange={setSelectedThemeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Platforms</legend>
              {PLATFORM_OPTIONS.map((platform) => (
                <label
                  key={platform.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2 text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={platformSelection[platform.id]}
                    onChange={(event) =>
                      handleTogglePlatform(platform.id, event.target.checked)
                    }
                    aria-label={`Toggle ${platform.label} export`}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{platform.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {platform.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
              {selectedPlatforms.length} platform
              {selectedPlatforms.length === 1 ? '' : 's'} selected
              {hasFiles ? `, ${exportFiles.length} file(s) ready.` : '.'}
            </div>
          </section>

          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="Export preview"
          >
            <div className="border-b border-slate-200 p-3 dark:border-slate-700">
              {previews.length > 0 ? (
                <Tabs
                  value={effectivePreviewTab}
                  onValueChange={(value) =>
                    setActivePreviewTab(value as ExportPlatform)
                  }
                >
                  <TabsList className="flex w-full flex-wrap">
                    {previews.map((preview) => (
                      <TabsTrigger
                        key={preview.platform}
                        value={preview.platform}
                        className="flex-1"
                      >
                        {preview.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select at least one platform to generate export files.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {exportError ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {exportError}
                </p>
              ) : null}

              {activePreview ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {activePreview.files.map((file) => (
                      <span
                        key={file.path}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {file.path}
                      </span>
                    ))}
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                    <code
                      className={`language-${activePreview.language}`}
                      dangerouslySetInnerHTML={{ __html: highlightedPreview }}
                    />
                  </pre>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!activePreview}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadCurrent}
            disabled={!activePreview}
          >
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
          <Button
            onClick={handleDownloadZip}
            disabled={!hasFiles || Boolean(exportError)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download ZIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
