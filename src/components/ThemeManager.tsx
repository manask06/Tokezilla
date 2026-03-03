import { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTokenStore } from '@/store/tokenStore';

type ModalMode = 'create' | 'rename' | 'duplicate' | 'delete' | null;

export function ThemeManager() {
  const themes = useTokenStore((state) => state.themes);
  const activeThemeId = useTokenStore((state) => state.activeThemeId);
  const switchTheme = useTokenStore((state) => state.switchTheme);
  const createTheme = useTokenStore((state) => state.createTheme);
  const renameTheme = useTokenStore((state) => state.renameTheme);
  const duplicateTheme = useTokenStore((state) => state.duplicateTheme);
  const deleteTheme = useTokenStore((state) => state.deleteTheme);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [draftName, setDraftName] = useState('');

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === activeThemeId),
    [activeThemeId, themes],
  );

  const closeModal = () => {
    setModalMode(null);
    setDraftName('');
  };

  const submitModal = () => {
    if (!activeTheme) {
      closeModal();
      return;
    }

    const normalizedName = draftName.trim();
    if (modalMode !== 'delete' && normalizedName.length === 0) {
      return;
    }

    if (modalMode === 'create') {
      createTheme(normalizedName);
    }
    if (modalMode === 'rename') {
      renameTheme(activeTheme.id, normalizedName);
    }
    if (modalMode === 'duplicate') {
      duplicateTheme(activeTheme.id, normalizedName);
    }
    if (modalMode === 'delete') {
      deleteTheme(activeTheme.id);
    }

    closeModal();
  };

  const openModal = (mode: ModalMode) => {
    setModalMode(mode);
    if (!activeTheme) {
      return;
    }

    if (mode === 'rename') {
      setDraftName(activeTheme.name);
    } else if (mode === 'duplicate') {
      setDraftName(`${activeTheme.name} Copy`);
    } else if (mode === 'create') {
      setDraftName('');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span className="max-w-32 truncate">
              {activeTheme?.name ?? 'Theme'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => switchTheme(theme.id)}
            >
              <span className="flex-1 truncate">{theme.name}</span>
              {theme.id === activeThemeId ? (
                <Check className="h-4 w-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openModal('create')}>
            Create Theme
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('rename')}>
            Rename Active Theme
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('duplicate')}>
            Duplicate Active Theme
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openModal('delete')}
            disabled={Boolean(activeTheme?.isDefault) || themes.length <= 1}
            className="text-red-600 focus:text-red-700"
          >
            Delete Active Theme
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={modalMode !== null}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Create Theme' : null}
              {modalMode === 'rename' ? 'Rename Theme' : null}
              {modalMode === 'duplicate' ? 'Duplicate Theme' : null}
              {modalMode === 'delete' ? 'Delete Theme' : null}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'delete'
                ? 'This action cannot be undone.'
                : 'Provide a theme name.'}
            </DialogDescription>
          </DialogHeader>

          {modalMode !== 'delete' ? (
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Theme name"
              aria-label="Theme name"
            />
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant={modalMode === 'delete' ? 'destructive' : 'default'}
              onClick={submitModal}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
