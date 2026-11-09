import type { Option } from '@/components/ui/option-cards';

export type DocumentType = 'dni' | 'ce';

interface DocumentRule {
  /** Full name, used as the field label. */
  label: string;
  /** Short name for tables and sheets. */
  short: string;
  placeholder: string;
  pattern: string;
  maxLength: number;
  valid: RegExp;
}

export const documentRules: Record<DocumentType, DocumentRule> = {
  dni: { label: 'DNI', short: 'DNI', placeholder: '8 dígitos', pattern: '[0-9]{8}', maxLength: 8, valid: /^\d{8}$/ },
  ce: { label: 'Carné de extranjería', short: 'CE', placeholder: '9 a 12 dígitos', pattern: '[0-9]{9,12}', maxLength: 12, valid: /^\d{9,12}$/ },
};

export const documentTypeOptions: Option<DocumentType>[] = [
  { value: 'dni', label: 'DNI', icon: 'idcard' },
  { value: 'ce', label: 'Carné de extranjería', icon: 'globe' },
];

/** "DNI 12345678" or "CE 123456789". A missing type means DNI. */
export function documentLabel(type: DocumentType | undefined, number: string): string {
  return `${documentRules[type ?? 'dni'].short} ${number}`;
}

/**
 * The document of a person who works in a gym: their login at atm-auth-api. It adds the passport (or any other
 * foreign ID) to the documents of members.
 */
export type AccountDocumentType = DocumentType | 'passport';

export const accountDocumentRules: Record<AccountDocumentType, DocumentRule> = {
  ...documentRules,
  passport: {
    label: 'Pasaporte u otro documento',
    short: 'Pasaporte',
    placeholder: '6 a 12 letras o números',
    pattern: '[A-Z0-9]{6,12}',
    maxLength: 12,
    valid: /^[A-Z0-9]{6,12}$/,
  },
};

export const accountDocumentTypeOptions: Option<AccountDocumentType>[] = [
  ...documentTypeOptions,
  { value: 'passport', label: 'Pasaporte', icon: 'file' },
];

/** Keeps what a document of that type can hold: digits for a DNI or CE, upper-case letters and digits for a passport. */
export function cleanAccountDocument(type: AccountDocumentType, value: string): string {
  return type === 'passport' ? cleanLoginDocument(value) : value.replace(/\D/g, '');
}

/**
 * What the sign-in field keeps: letters and digits in upper case, since the type is not asked there.
 * atm-auth-api also ignores spaces, dashes and case.
 */
export function cleanLoginDocument(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12);
}

/** "DNI 12345678", "CE 001234567" or "Pasaporte AB123456". A missing type means DNI. */
export function accountDocumentLabel(type: AccountDocumentType | undefined, number: string): string {
  return `${accountDocumentRules[type ?? 'dni'].short} ${number}`;
}
