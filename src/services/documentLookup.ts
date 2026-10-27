// MOCKUP ONLY: these lookups do not query RENIEC, Migraciones or SUNAT. They return plausible
// fictional data derived from the number typed, after a short delay, so the
// "search" buttons can be demonstrated. Replace with real API calls later.

import { documentRules, type DocumentType } from '@/config/documentTypes';

export interface PersonRecord {
  firstName: string;
  lastName: string;
}

export interface CompanyRecord {
  legalName: string;
  address: string;
}

const FIRST_NAMES = ['Carlos Alberto', 'María Elena', 'Luis Fernando', 'Rosa Isabel', 'Jorge Luis', 'Ana Lucía', 'Miguel Ángel', 'Patricia Milagros'];
const LAST_NAMES = ['Quispe Huamán', 'Ramos Flores', 'Torres Vega', 'Salazar Rojas', 'Mendoza Paredes', 'Castillo Díaz', 'Vargas Soto', 'Rojas Campos'];
const FOREIGN_FIRST_NAMES = ['Andrés Felipe', 'Daniela Sofía', 'José Gregorio', 'Mariana Alejandra', 'Santiago', 'Valeria Carolina'];
const FOREIGN_LAST_NAMES = ['Pérez Rondón', 'González Marín', 'Rodríguez Salas', 'Hernández Ortiz', 'Martínez Cardona', 'Silva Barrios'];
const COMPANY_WORDS = ['Power', 'Fuerza', 'Atlas', 'Vital', 'Titán', 'Olimpo', 'Impulso', 'Zenit'];
const COMPANY_KINDS = ['Fitness', 'Gym', 'Sport Center', 'Training'];
const STREETS = ['Av. Larco 1250', 'Jr. de la Unión 480', 'Av. Arequipa 2310', 'Calle Los Pinos 155', 'Av. Brasil 905'];
const DISTRICTS = ['Miraflores', 'Barranco', 'San Miguel', 'Los Olivos', 'Surco'];

const DELAY_MS = 600;

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function digitsSeed(value: string, offset: number): number {
  return [...value].reduce((sum, digit, index) => sum + Number(digit) * (index + 1 + offset), 0);
}

function wait(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, DELAY_MS));
}

/** Returns null when the number is not a valid DNI (8 digits). */
export async function lookupDni(dni: string): Promise<PersonRecord | null> {
  if (!/^\d{8}$/.test(dni)) return null;
  await wait();
  return { firstName: pick(FIRST_NAMES, digitsSeed(dni, 0)), lastName: pick(LAST_NAMES, digitsSeed(dni, 3)) };
}

/** Returns null when the number is not a valid carné de extranjería (9 to 12 digits). */
export async function lookupForeignCard(card: string): Promise<PersonRecord | null> {
  if (!documentRules.ce.valid.test(card)) return null;
  await wait();
  return { firstName: pick(FOREIGN_FIRST_NAMES, digitsSeed(card, 0)), lastName: pick(FOREIGN_LAST_NAMES, digitsSeed(card, 3)) };
}

/** Looks a person up by the kind of document they carry. */
export function lookupPerson(type: DocumentType, number: string): Promise<PersonRecord | null> {
  return type === 'dni' ? lookupDni(number) : lookupForeignCard(number);
}

/** Returns null when the number is not a valid RUC (11 digits). */
export async function lookupRuc(ruc: string): Promise<CompanyRecord | null> {
  if (!/^\d{11}$/.test(ruc)) return null;
  await wait();
  const seed = digitsSeed(ruc, 0);
  return {
    legalName: `${pick(COMPANY_WORDS, seed)} ${pick(COMPANY_KINDS, seed + 1)} S.A.C.`,
    address: `${pick(STREETS, seed + 2)}, ${pick(DISTRICTS, seed + 3)}`,
  };
}
