import { api, ApiError } from '@/config/apiClient';
import type { DocumentType } from '@/config/documentTypes';

export interface PersonRecord {
  firstName: string;
  lastName: string;
}

export interface CompanyRecord {
  legalName: string;
  address: string;
}

interface PersonAnswer {
  first_names: string;
  paternal_surname: string;
  maternal_surname: string;
}

interface CompanyAnswer {
  legal_name: string;
  address: string | null;
}

/** A 404 means "no data for this number": the caller lets the user type it. Other failures are thrown. */
async function orNull<T>(lookup: Promise<T>): Promise<T | null> {
  try {
    return await lookup;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Looks a DNI up through the API (atm-identity-api). Null when it is not valid or not found. */
export async function lookupDni(dni: string): Promise<PersonRecord | null> {
  if (!/^\d{8}$/.test(dni)) return null;
  const person = await orNull(api.get<PersonAnswer>(`/documents/persons/${dni}`));
  if (!person) return null;
  return { firstName: person.first_names, lastName: [person.paternal_surname, person.maternal_surname].filter(Boolean).join(' ') };
}

/** The carné de extranjería has no lookup: it is always typed by hand. */
export function lookupPerson(type: DocumentType, number: string): Promise<PersonRecord | null> {
  return type === 'dni' ? lookupDni(number) : Promise.resolve(null);
}

/** Looks a RUC up through the API. Null when it is not valid or not found. */
export async function lookupRuc(ruc: string): Promise<CompanyRecord | null> {
  if (!/^\d{11}$/.test(ruc)) return null;
  const company = await orNull(api.get<CompanyAnswer>(`/documents/companies/${ruc}`));
  return company ? { legalName: company.legal_name, address: company.address ?? '' } : null;
}
