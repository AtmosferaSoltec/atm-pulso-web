import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestPage } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { documentLabel } from '@/config/documentTypes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMemberPending } from '@/features/sales/hooks/useSales';
import type { DocumentType, MemberView, Pagination } from '@/types/api.types';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatCurrency';

export interface PickedMember {
  id: string;
  full_name: string;
  document_type: DocumentType;
  document_number: string;
}

interface MemberPickerProps {
  value: PickedMember | null;
  onChange: (member: PickedMember | null) => void;
}

/** Looks a member up by name or document (optional in a sale). Shows what the chosen member already owes. */
export function MemberPicker({ value, onChange }: MemberPickerProps): ReactElement {
  const [text, setText] = useState('');
  const term = useDebouncedValue(text.trim());
  const results = useQuery({
    queryKey: ['members', 'picker', term],
    queryFn: () => requestPage<MemberView, Pagination>('/members', { query: { q: term, page: 1, page_size: 5 } }),
    enabled: term.length >= 2 && !value,
  });
  const pending = useMemberPending(value?.id ?? null);
  const owed = pending.data && Number(pending.data.balance) > 0 ? pending.data.balance : null;

  if (value) {
    return (
      <div className="qs-member chosen">
        <span className="qs-member-text">
          <strong>{value.full_name}</strong>
          <small>
            {documentLabel(value.document_type, value.document_number)}
            {owed && ` · pendiente de cobro ${formatCurrency(owed)}`}
          </small>
        </span>
        <IconButton icon="close" label="Quitar al miembro" onClick={() => onChange(null)} />
      </div>
    );
  }
  return (
    <div className="qs-member">
      <div className="search-field">
        <Icon name="search" size={18} />
        <Input aria-label="Miembro (opcional)" placeholder="Miembro (opcional): nombre o documento" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      {results.isError && (
        <p className="error" role="alert">
          {describeError(results.error)}
        </p>
      )}
      {term.length >= 2 && results.data && (
        <ul className="qs-member-results" aria-label="Resultados">
          {results.data.data.length === 0 && <li className="muted">Sin resultados</li>}
          {results.data.data.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => {
                  onChange({ id: member.id, full_name: member.full_name, document_type: member.document_type, document_number: member.document_number });
                  setText('');
                }}
              >
                <strong>{member.full_name}</strong>
                <small>{documentLabel(member.document_type, member.document_number)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
