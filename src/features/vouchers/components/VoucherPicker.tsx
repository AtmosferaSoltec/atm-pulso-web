import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Icon } from '@/components/ui/icon';
import { MAX_VOUCHERS } from '@/features/vouchers/services/voucherFile';
import { VoucherDropzone } from '@/features/vouchers/components/VoucherDropzone';

interface VoucherPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

function Preview({ file }: { file: File }): ReactElement {
  const url = useMemo(() => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url ? <img src={url} alt="" /> : <Icon name="file" size={22} />;
}

/** Optional proofs of payment chosen before the sale is saved; they upload right after it. Up to five. */
export function VoucherPicker({ files, onChange }: VoucherPickerProps): ReactElement {
  const [problem, setProblem] = useState('');

  function add(picked: File[]): void {
    const room = MAX_VOUCHERS - files.length;
    const fresh = picked.filter((file) => !files.some((kept) => kept.name === file.name && kept.size === file.size));
    if (fresh.length > room) setProblem(`Máximo ${MAX_VOUCHERS} comprobantes por pago.`);
    else setProblem('');
    onChange([...files, ...fresh.slice(0, Math.max(room, 0))]);
  }

  return (
    <div className="voucher-picker full">
      <span className="voucher-label">Comprobante (opcional)</span>
      {files.length > 0 && (
        <ul className="voucher-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`}>
              <span className="voucher-thumb">
                <Preview file={file} />
              </span>
              <span className="voucher-name">{file.name}</span>
              <IconButton icon="close" label={`Quitar ${file.name}`} onClick={() => onChange(files.filter((_, position) => position !== index))} />
            </li>
          ))}
        </ul>
      )}
      {files.length < MAX_VOUCHERS && <VoucherDropzone onFiles={add} onProblem={setProblem} />}
      {problem && (
        <p role="alert" className="error">
          {problem}
        </p>
      )}
    </div>
  );
}
