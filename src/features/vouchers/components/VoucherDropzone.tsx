import { useEffect, useRef, useState, type DragEvent, type ReactElement } from 'react';
import { Icon } from '@/components/ui/icon';
import { VOUCHER_ACCEPT, voucherProblem } from '@/features/vouchers/services/voucherFile';

interface VoucherDropzoneProps {
  /** Receives only files that passed the type and size check. */
  onFiles: (files: File[]) => void;
  onProblem: (message: string) => void;
  disabled?: boolean;
}

/** Drop a file, choose it, or paste a copied image (Ctrl+V): the three ways to get a photo from WhatsApp Web. */
export function VoucherDropzone({ onFiles, onProblem, disabled = false }: VoucherDropzoneProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | File[] | null): void {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const valid: File[] = [];
    for (const file of files) {
      const problem = voucherProblem(file);
      if (problem) onProblem(problem);
      else valid.push(file);
    }
    if (valid.length > 0) onFiles(valid);
  }

  // Pasting an image anywhere in the dialog attaches it (but never steals a paste of text).
  useEffect(() => {
    if (disabled) return;
    function onPaste(event: ClipboardEvent): void {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf');
      if (files.length === 0) return;
      event.preventDefault();
      take(files);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, onFiles, onProblem]);

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setOver(false);
    if (!disabled) take(event.dataTransfer.files);
  }

  return (
    <div
      className={`voucher-zone${over ? ' over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept={VOUCHER_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
      />
      <button type="button" className="voucher-zone-button" disabled={disabled} onClick={() => input.current?.click()}>
        <Icon name="clip" size={20} />
        <span>
          <strong>Adjuntar comprobante</strong>
          <small>Arrastra la imagen, elígela o pégala con Ctrl+V</small>
        </span>
      </button>
    </div>
  );
}
