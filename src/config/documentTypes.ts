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
