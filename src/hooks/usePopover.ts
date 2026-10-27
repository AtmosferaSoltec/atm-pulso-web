import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';

interface PopoverState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True when the panel should open upwards because it would not fit below the trigger. */
  above: boolean;
  root: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLButtonElement | null>;
  /** Closes the panel and returns focus to the trigger. */
  close: () => void;
  /** Attach to the wrapper: Escape closes only this panel, not a dialog around it. */
  onKeyDown: (event: KeyboardEvent) => void;
}

/** Behaviour shared by floating panels (calendar, color picker): outside click, Escape, flip upwards. */
export function usePopover(panelHeight: number): PopoverState {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom;
    setAbove(roomBelow < panelHeight + 16 && rect.top > roomBelow);
  }, [open, panelHeight]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [open]);

  function close(): void {
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }

  return { open, setOpen, above, root, trigger, close, onKeyDown };
}
