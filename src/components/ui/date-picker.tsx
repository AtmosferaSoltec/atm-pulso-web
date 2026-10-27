import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/utils/formatDate";

/** Dates travel as "YYYY-MM-DD" strings; the calendar works with local dates. */
function toDate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}
function toIso(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const CALENDAR_HEIGHT = 370;

interface DatePickerProps {
  /** Accessible name; also read by screen readers before the selected date. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Reference "today" (ISO). Defaults to the real current date. */
  today?: string;
}

export function DatePicker({ label, value, onChange, today }: DatePickerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = toDate(value);
  const reference = today ? toDate(today) : new Date();

  // Open upwards when the calendar would not fit below the field.
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const needed = CALENDAR_HEIGHT + 16;
    setAbove(window.innerHeight - rect.bottom < needed && rect.top > window.innerHeight - rect.bottom);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function choose(date: Date | undefined): void {
    if (!date) return;
    onChange(toIso(date));
    setOpen(false);
    trigger.current?.focus();
  }

  // Escape closes only the calendar, not the dialog that contains it.
  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="date-picker" ref={root} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className="date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value ? formatDate(value) : "sin fecha"}`}
        onClick={() => setOpen(!open)}
      >
        <Icon name="calendar" size={18} />
        <span>{value ? formatDate(value) : "Elegir fecha"}</span>
      </button>
      {open && (
        <div className={`date-popover ${above ? "above" : ""}`} role="dialog" aria-label={label}>
          <DayPicker
            mode="single"
            locale={es}
            weekStartsOn={1}
            showOutsideDays
            today={reference}
            selected={selected}
            defaultMonth={selected ?? reference}
            onSelect={choose}
          />
          <div className="date-footer">
            <button type="button" onClick={() => reference && choose(reference)}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
