import { useEffect, useRef, useId, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}): ReactElement {
  const ref = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
 const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    // Start on the first field (or the dialog itself) instead of the close button.
    (body.current?.querySelector<HTMLElement>('input:not([readonly]):not([type=checkbox])') ?? dialog)?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`dialog ${wide ? "wide" : ""}`}
      // Clicking the backdrop must not close the dialog: dragging a text selection out of a field
      // would count as a click there. It closes with the X, the form's own buttons, or Escape.
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Cerrar" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </div>
      <div className="dialog-body" ref={body}>
        {children}
      </div>
    </dialog>
  );
}
