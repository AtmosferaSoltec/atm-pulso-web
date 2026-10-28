import { useEffect, type ReactElement } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import type { AccessResult } from "@/features/access/types/access.types";

interface AccessAlertProps {
  result: AccessResult;
  branchName: string;
  onClose: () => void;
}

/** How long an allowed answer stays on screen. A refusal stays until it is closed: it is the one to read. */
const ALLOWED_VISIBLE_MS = 6000;

/** The answer of a quick check, floating over whatever the user is doing. */
export function AccessAlert({
  result,
  branchName,
  onClose,
}: AccessAlertProps): ReactElement {
  useEffect(() => {
    if (!result.allowed) return;
    const timeout = window.setTimeout(onClose, ALLOWED_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [result, onClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role={result.allowed ? "status" : "alert"}
      className={`access-alert ${result.allowed ? "allowed" : "denied"}`}
    >
      <Icon name={result.allowed ? "check" : "close"} size={30} />
      <div className="access-alert-text">
        <strong>
          {result.allowed ? "Acceso permitido" : "Acceso no permitido"}
        </strong>
        {result.name && (
          <span className="access-alert-name">{result.name}</span>
        )}
        <span>{result.reason}</span>
        <small>{branchName}</small>
      </div>
      <IconButton icon="close" label="Cerrar aviso" onClick={onClose} />
    </div>
  );
}
