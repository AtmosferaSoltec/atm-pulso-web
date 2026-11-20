/** The app routes by URL hash: `#members` is a page, `#members/<id>` a page with one record. No imports: unit-testable. */
export interface HashRoute {
  /** First segment: the page name ("" when the hash is empty). */
  segment: string;
  /** Second segment, decoded (e.g. the member id); null when absent. */
  param: string | null;
}

export function parseHash(hash: string): HashRoute {
  const [segment = '', rest] = hash.replace(/^#/, '').split('/');
  let param: string | null = null;
  if (rest) {
    try {
      param = decodeURIComponent(rest);
    } catch {
      param = null;
    }
  }
  return { segment, param };
}

/** Builds the hash of a page, optionally with a record id. */
export function buildHash(segment: string, param?: string | null): string {
  return param ? `${segment}/${encodeURIComponent(param)}` : segment;
}
