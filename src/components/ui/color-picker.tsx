import type { ReactElement } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { usePopover } from "@/hooks/usePopover";

interface ColorPickerProps {
  /** Accessible name of the trigger and of the panel. */
  label: string;
  /** Color as "#rrggbb". */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PANEL_HEIGHT = 290;

/** "#abc" becomes "#aabbcc": the rest of the app only accepts six-digit colors. */
function toSixDigits(color: string): string {
  return /^#[0-9a-f]{3}$/i.test(color) ? `#${[...color.slice(1)].map((digit) => digit + digit).join("")}` : color;
}

/** A swatch that opens a color area, a hue slider and a hexadecimal field. */
export function ColorPicker({ label, value, onChange, disabled = false }: ColorPickerProps): ReactElement {
  const { open, setOpen, above, root, trigger, onKeyDown } = usePopover(PANEL_HEIGHT);
  const change = (color: string): void => onChange(toSixDigits(color).toLowerCase());

  return (
    <div className="color-picker" ref={root} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className="color-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value.toUpperCase()}`}
        onClick={() => setOpen(!open)}
      >
        <span className="color-swatch" style={{ background: value }} />
        <span>{value.toUpperCase()}</span>
      </button>
      {open && (
        <div className={`color-popover ${above ? "above" : ""}`} role="dialog" aria-label={label}>
          <HexColorPicker color={value} onChange={change} />
          <label className="color-hex">
            <span>Hex</span>
            <span className="color-hex-field">
              <b aria-hidden="true">#</b>
              <HexColorInput aria-label="Código hexadecimal" color={value} onChange={change} prefixed={false} />
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
