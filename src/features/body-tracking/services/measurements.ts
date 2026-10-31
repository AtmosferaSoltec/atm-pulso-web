import type { BodyMeasurement, BodyMeasurementInput } from '@/types/api.types';

/** Ranges the API accepts (kg or cm, % for body fat). The server is the authority; these only save a round trip. */
export const RANGES = {
  weight_kg: { min: 20, max: 400, label: 'Peso' },
  height_cm: { min: 50, max: 250, label: 'Altura' },
  body_fat_pct: { min: 2, max: 70, label: '% de grasa' },
  waist_cm: { min: 20, max: 300, label: 'Cintura' },
  chest_cm: { min: 20, max: 300, label: 'Pecho' },
  hip_cm: { min: 20, max: 300, label: 'Cadera' },
} as const;

export type ValueField = keyof typeof RANGES;
export const VALUE_FIELDS = Object.keys(RANGES) as ValueField[];

/** What the person typed: every value is text so "95," or "" are representable while typing. */
export interface MeasurementFormValues {
  measured_on: string;
  weight_kg: string;
  height_cm: string;
  body_fat_pct: string;
  waist_cm: string;
  chest_cm: string;
  hip_cm: string;
  notes: string;
}

export function emptyForm(today: string): MeasurementFormValues {
  return { measured_on: today, weight_kg: '', height_cm: '', body_fat_pct: '', waist_cm: '', chest_cm: '', hip_cm: '', notes: '' };
}

export function formFromMeasurement(record: BodyMeasurement): MeasurementFormValues {
  const text = (value: number | null | undefined): string => (value === null || value === undefined ? '' : String(value));
  return {
    measured_on: record.measured_on,
    weight_kg: text(record.weight_kg),
    height_cm: text(record.height_cm),
    body_fat_pct: text(record.body_fat_pct),
    waist_cm: text(record.waist_cm),
    chest_cm: text(record.chest_cm),
    hip_cm: text(record.hip_cm),
    notes: record.notes,
  };
}

/** "95", "95.5" or "95,5" -> 95.5; anything else (two decimals, letters, empty) -> null. */
export function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (!/^\d{1,4}(\.\d)?$/.test(text)) return null;
  return Number(text);
}

export type BuildResult = { ok: true; input: BodyMeasurementInput } | { ok: false; error: string };

/** Turns the form into the API body, or says in Spanish what to fix. Empty optional values are left out. */
export function buildMeasurementInput(form: MeasurementFormValues, today: string): BuildResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.measured_on)) return { ok: false, error: 'Elige la fecha de la medición.' };
  if (form.measured_on > today) return { ok: false, error: 'La fecha no puede ser futura.' };
  const input: BodyMeasurementInput = { measured_on: form.measured_on, notes: form.notes.trim() };
  let count = 0;
  for (const field of VALUE_FIELDS) {
    const raw = form[field].trim();
    if (raw === '') continue;
    const value = parseDecimal(raw);
    const { min, max, label } = RANGES[field];
    if (value === null || value < min || value > max) return { ok: false, error: `${label}: ingresa un valor entre ${min} y ${max} (un decimal como máximo).` };
    input[field] = value;
    count += 1;
  }
  if (count === 0) return { ok: false, error: 'Ingresa al menos un valor, por ejemplo el peso.' };
  return { ok: true, input };
}

export interface WeightPoint {
  id: string;
  date: string;
  value: number;
}

/** The weights in time order (oldest first); measurements without a weight do not appear in the chart. */
export function weightPoints(records: BodyMeasurement[]): WeightPoint[] {
  return records
    .filter((record) => typeof record.weight_kg === 'number')
    .map((record) => ({ id: record.id, date: record.measured_on, value: record.weight_kg as number, created: record.created_at }))
    .sort((a, b) => (a.date === b.date ? a.created.localeCompare(b.created) : a.date.localeCompare(b.date)))
    .map(({ id, date, value }) => ({ id, date, value }));
}

const DAY = 86_400_000;
const toTime = (date: string): number => Date.parse(`${date}T00:00:00Z`);

export interface ChartDot extends WeightPoint {
  x: number;
  y: number;
}

export interface ChartModel {
  dots: ChartDot[];
  path: string;
  /** Horizontal guide lines with the weight they stand for. */
  ticks: { y: number; label: string }[];
  min: number;
  max: number;
}

export interface ChartBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Rounds the weight range outwards so the line never touches the frame; at least 2 kg tall. */
export function weightRange(points: WeightPoint[]): { min: number; max: number } {
  const values = points.map((point) => point.value);
  let min = Math.floor(Math.min(...values) - 1);
  let max = Math.ceil(Math.max(...values) + 1);
  if (max - min < 2) {
    min -= 1;
    max += 1;
  }
  return { min, max };
}

/** Positions the weights on an SVG box: time on x (proportional to days), weight on y. */
export function chartModel(points: WeightPoint[], box: ChartBox): ChartModel {
  if (points.length === 0) return { dots: [], path: '', ticks: [], min: 0, max: 0 };
  const { min, max } = weightRange(points);
  const innerWidth = box.width - box.left - box.right;
  const innerHeight = box.height - box.top - box.bottom;
  const first = toTime(points[0].date);
  const span = toTime(points[points.length - 1].date) - first;
  const xOf = (date: string): number => (span === 0 ? box.left + innerWidth / 2 : box.left + ((toTime(date) - first) / span) * innerWidth);
  const yOf = (value: number): number => box.top + (1 - (value - min) / (max - min)) * innerHeight;
  const dots = points.map((point) => ({ ...point, x: round(xOf(point.date)), y: round(yOf(point.value)) }));
  const steps = 3;
  const ticks = Array.from({ length: steps + 1 }, (_, index) => {
    const value = min + ((max - min) * index) / steps;
    return { y: round(yOf(value)), label: String(Math.round(value * 10) / 10) };
  });
  return { dots, path: dots.map((dot, index) => `${index === 0 ? 'M' : 'L'}${dot.x} ${dot.y}`).join(' '), ticks, min, max };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** First weight, last weight and their difference (one decimal), with the days between them; null with fewer than two. */
export function weightChange(points: WeightPoint[]): { from: number; to: number; delta: number; days: number } | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  return { from: first.value, to: last.value, delta: Math.round((last.value - first.value) * 10) / 10, days: Math.round((toTime(last.date) - toTime(first.date)) / DAY) };
}

/** "-2 kg", "+1,5 kg", "0 kg" with the Spanish decimal comma. */
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${formatNumber(Math.abs(delta))} kg`;
}

export function formatNumber(value: number): string {
  return String(value).replace('.', ',');
}

/** Weight difference of each measurement against the previous one that has a weight (list is newest first). */
export function deltasAgainstPrevious(records: BodyMeasurement[]): Map<string, number> {
  const withWeight = weightPoints(records);
  const out = new Map<string, number>();
  for (let index = 1; index < withWeight.length; index += 1) out.set(withWeight[index].id, Math.round((withWeight[index].value - withWeight[index - 1].value) * 10) / 10);
  return out;
}
