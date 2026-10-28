/** A DNI has 8 digits; a carné de extranjería up to 12. */
export const MAX_DOCUMENT_LENGTH = 12;

/** What the document fields accept while typing: digits only, no more than the longest document. */
export function cleanDocument(text: string): string {
  return text.replace(/\D/g, '').slice(0, MAX_DOCUMENT_LENGTH);
}

/** Selector of the field where a document is typed to verify access (the page's or the top bar's). */
export const DOCUMENT_INPUT_SELECTOR = 'input[data-document-input]';
