import type { KeyboardEvent, ReactElement } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  /** Small second line, e.g. which branch the option refers to. */
  description?: string;
}

interface OptionCardsProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** "card": icon above the label, for few options. "chip": inline, for short labels. */
  variant?: "card" | "chip";
  className?: string;
}

/** A single-choice picker rendered as selectable cards; replaces short native selects. */
export function OptionCards<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  variant = "card",
  className = "",
}: OptionCardsProps<T>): ReactElement {
  // With nothing selected the group would be unreachable by keyboard, so the first option takes the tab stop.
  const hasSelection = options.some((option) => option.value === value);
  function move(event: KeyboardEvent, index: number): void {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    (event.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement | undefined)?.focus();
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`option-cards ${variant} ${className}`}
      style={variant === "card" ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!hasSelection && index === 0) ? 0 : -1}
            disabled={disabled}
            className="option-card"
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
          >
            {option.icon && <Icon name={option.icon} size={variant === "card" ? 18 : 17} />}
            <span className="option-text">
              <span>{option.label}</span>
              {option.description && <small>{option.description}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
