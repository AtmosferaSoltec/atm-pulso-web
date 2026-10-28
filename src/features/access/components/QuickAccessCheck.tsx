import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { useAccessCheck } from '@/features/access/hooks/useAccess';
import { cleanDocument, DOCUMENT_INPUT_SELECTOR, MAX_DOCUMENT_LENGTH } from '@/features/access/services/accessDocument';
import { checkText } from '@/features/access/services/accessReasons';
import type { AccessResult } from '@/features/access/types/access.types';

interface QuickAccessCheckProps {
  branchId: string;
  /** Hides the field (the access page has its own) while keeping the keyboard shortcuts alive. */
  hidden?: boolean;
  onResult: (result: AccessResult) => void;
}

/** Whether the keys typed now belong to a text field, where "/" must stay a character. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Verifies a document from any page: type it, Enter, and the answer appears as an alert. Desktop only. */
export function QuickAccessCheck({ branchId, hidden = false, onResult }: QuickAccessCheckProps): ReactElement | null {
  const [document, setDocument] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const check = useAccessCheck(branchId);

  // "/" (outside a text field) and Ctrl/Cmd+K jump to the field from anywhere, unless a dialog is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const slash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.target);
      const palette = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey;
      if (!slash && !palette) return;
      if (window.document.querySelector('dialog[open]')) return;
      const field = window.document.querySelector<HTMLInputElement>(DOCUMENT_INPUT_SELECTOR);
      if (!field) return;
      event.preventDefault();
      field.focus();
      field.select();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const answer = await check.mutateAsync(document);
      onResult({ allowed: answer.allowed, name: answer.member?.full_name, reason: checkText(answer) });
    } catch (failure) {
      onResult({ allowed: false, reason: describeError(failure) });
    }
    setDocument('');
    input.current?.focus();
  }

  if (hidden) return null;
  return (
    <form className="quick-access" onSubmit={(event) => void verify(event)}>
      <Icon name="access" size={18} />
      <Input
        ref={input}
        data-document-input
        autoComplete="off"
        aria-label="Verificar documento"
        title="Verificar acceso (/ o Ctrl+K)"
        placeholder="Verificar documento"
        inputMode="numeric"
        pattern="[0-9]{8,12}"
        required
        maxLength={MAX_DOCUMENT_LENGTH}
        value={document}
        onChange={(event) => setDocument(cleanDocument(event.target.value))}
      />
      <kbd aria-hidden="true">Ctrl K</kbd>
    </form>
  );
}
