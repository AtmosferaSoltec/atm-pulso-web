import type { ButtonHTMLAttributes, ReactElement } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  icon: IconName;
  /** Accessible name and tooltip. The button renders no visible text. */
  label: string;
  size?: number;
}
export function IconButton({
  icon,
  label,
  size = 18,
  className = "",
  type = "button",
  ...props
}: IconButtonProps): ReactElement {
  return (
    <button
      type={type}
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
