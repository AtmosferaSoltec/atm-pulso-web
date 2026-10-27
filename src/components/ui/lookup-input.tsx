import type { ComponentProps, ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";

interface LookupInputProps extends ComponentProps<"input"> {
  /** Accessible name and tooltip of the search button. */
  searchLabel: string;
  searching?: boolean;
  onSearch: () => void;
}

/** An input with a trailing search button, used to look a document number up. */
export function LookupInput({
  searchLabel,
  searching = false,
  onSearch,
  className = "",
  ...props
}: LookupInputProps): ReactElement {
  return (
    <div className="lookup-input">
      <Input
        className={className}
        onKeyDown={(event) => {
          // Enter searches instead of submitting the whole form.
          if (event.key !== "Enter") return;
          event.preventDefault();
          onSearch();
        }}
        {...props}
      />
      <IconButton
        icon={searching ? "clock" : "search"}
        label={searchLabel}
        disabled={searching}
        onClick={onSearch}
      />
    </div>
  );
}
