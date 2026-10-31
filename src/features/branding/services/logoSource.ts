/**
 * What an <img> loads for the gym's `logo_url`. The API answers a temporary signed https link (atm-storage-api), which is
 * used as it is; an address starting with `/` is an API path (older contract) and gets the API base. Anything else
 * (no logo, other schemes) is no logo: the monogram is shown.
 */
export function logoSource(logoUrl: string | null | undefined, apiBase: string): string | null {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  if (logoUrl.startsWith('/')) return `${apiBase}${logoUrl}`;
  return null;
}
