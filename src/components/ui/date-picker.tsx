import type { ReactElement } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Icon } from "@/components/ui/icon";
import { usePopover } from "@/hooks/usePopover";
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
  /** Text shown while no date is chosen. */
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, today, placeholder = "Elegir fecha" }: DatePickerProps): ReactElement {
  const { open, setOpen, above, root, trigger, close, onKeyDown } = usePopover(CALENDAR_HEIGHT);
  const selected = toDate(value);
  const reference = today ? toDate(today) : new Date();

  function choose(date: Date | undefined): void {
    if (!date) return;
    onChange(toIso(date));
    close();
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
        <span>{value ? formatDate(value) : placeholder}</span>
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
