import type { ComponentProps, ReactElement } from "react";
export function Input({
  className = "",
  ...props
}: ComponentProps<"input">): ReactElement {
  return <input className={`input ${className}`} {...props} />;
}
