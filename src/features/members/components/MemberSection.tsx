import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';

interface MemberSectionProps {
  title: string;
  /** Small text next to the title (a count, for instance). */
  hint?: string;
  defaultOpen?: boolean;
  /** Rendered only while the section is open: a folded section mounts (and so loads) nothing. */
  children: ReactNode;
}

/** A collapsible card of the member's page. */
export function MemberSection({ title, hint, defaultOpen = false, children }: MemberSectionProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section className="card member-section no-print">
      <h2>
        <button type="button" className="member-section-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(!open)}>
          <span className="member-section-title">{title}</span>
          {hint && <small>{hint}</small>}
          <span className={`member-section-chevron ${open ? 'open' : ''}`}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
      </h2>
      {open && (
        <div className="member-section-body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}
