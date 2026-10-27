import type { ReactElement, ReactNode } from "react";
interface FieldProps {
  label: string;
  /** Adds the red asterisk. Fields without it are optional. */
  required?: boolean;
  hint?: string;
  className?: string;
  /** Use "div" when the control is not a native input (cards, date picker). */
  as?: "label" | "div";
  children: ReactNode;
}
export function Field({
  label,
  required = false,
  hint,
  className = "",
  as: Tag = "label",
  children,
}: FieldProps): ReactElement {
  return (
    <Tag className={`field ${required ? "required" : ""} ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </Tag>
  );
}
