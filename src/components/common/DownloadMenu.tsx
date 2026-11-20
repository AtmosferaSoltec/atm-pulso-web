import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { usePopover } from '@/hooks/usePopover';
import { downloadFormats, type DownloadFormat } from '@/utils/downloadFile';
import '@/components/common/download-menu.css';

interface DownloadMenuProps {
  /** Downloads the list in the chosen format; a rejection is shown by the caller. */
  onDownload: (format: DownloadFormat) => Promise<void>;
  /** Tooltip of the trigger, e.g. "Descargar los pagos filtrados". */
  title?: string;
}

const PANEL_HEIGHT = 170;

/**
 * One "Descargar" button that opens a small menu: Excel, CSV or PDF. Keyboard: Enter/Space or the down arrow open it on
 * the first option, the arrows (and Home/End) move, Escape or Tab close it.
 */
export function DownloadMenu({ onDownload, title }: DownloadMenuProps): ReactElement {
  const { open, setOpen, above, root, trigger, close, onKeyDown } = usePopover(PANEL_HEIGHT);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [busy, setBusy] = useState<DownloadFormat | null>(null);

  useEffect(() => {
    if (open) items.current[0]?.focus();
  }, [open]);

  function move(event: KeyboardEvent<HTMLDivElement>): void {
    const buttons = items.current.filter((item): item is HTMLButtonElement => item !== null);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const target: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: buttons.length - 1 };
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (!(event.key in target)) return;
    event.preventDefault();
    buttons[(target[event.key] + buttons.length) % buttons.length]?.focus();
  }

  async function choose(format: DownloadFormat): Promise<void> {
    close();
    setBusy(format);
    try {
      await onDownload(format);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="download-menu" ref={root} onKeyDown={onKeyDown}>
      <Button
        ref={trigger}
        variant="secondary"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy !== null}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Icon name="download" size={16} /> {busy ? 'Descargando…' : 'Descargar'}
        <span className={`download-chevron ${open ? 'open' : ''}`} aria-hidden="true">
          <Icon name="chevron" size={14} />
        </span>
      </Button>
      {open && (
        <div className={`download-popover ${above ? 'above' : ''}`} role="menu" aria-label="Formato de descarga" onKeyDown={move}>
          {downloadFormats.map((option, index) => (
            <button
              key={option.format}
              ref={(element) => {
                items.current[index] = element;
              }}
              type="button"
              role="menuitem"
              className="download-option"
              onClick={() => void choose(option.format)}
            >
              <span className={`download-badge ${option.format}`} aria-hidden="true">
                {option.badge}
              </span>
              <span className="download-text">
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
