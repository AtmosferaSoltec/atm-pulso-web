/**
 * The only place that talks HTTP. It adds the bearer token (kept in memory; AuthProvider mirrors it in sessionStorage so a reload keeps the session),
 * the inspection header for the superadmin, and turns the API's error shape into `ApiError`.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** The first field problem of a VALIDATION_FAILED answer, if any. */
  get fieldIssues(): { field: string; code: string }[] {
    return Array.isArray(this.details) ? (this.details as { field: string; code: string }[]) : [];
  }
}

interface Credentials {
  token: string | null;
  inspectedOrganizationId: string | null;
}

const credentials: Credentials = { token: null, inspectedOrganizationId: null };
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  credentials.token = token;
}

/** The superadmin looks at one client at a time; the header is sent on GET requests only. */
export function setInspectedOrganization(id: string | null): void {
  credentials.inspectedOrganizationId = id;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  body?: unknown;
  /** A file sent as the raw body (the gym logo); mutually exclusive with `body`. */
  file?: Blob;
  query?: Query;
  signal?: AbortSignal;
}

/** Absolute address of an API path, for things the browser loads by itself (an image). */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function send(method: string, path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.file) headers['Content-Type'] = options.file.type;
  if (credentials.token) headers.Authorization = `Bearer ${credentials.token}`;
  if (method === 'GET' && credentials.inspectedOrganizationId) headers['X-Organization-Id'] = credentials.inspectedOrganizationId;
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.file ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
  }
  if (response.ok) return response;
  const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string; details?: unknown } } | null;
  const apiError = new ApiError(response.status, payload?.error?.code ?? 'UNKNOWN', payload?.error?.message ?? 'Algo salió mal.', payload?.error?.details);
  if (response.status === 401 && apiError.code === 'UNAUTHORIZED' && credentials.token) onUnauthorized?.();
  throw apiError;
}

/** Calls the API and returns the `data` of the answer. */
export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(method, path, options);
  return ((await response.json()) as { data: T }).data;
}

/** Fetches a private file with the session's token; the caller shows it from the bytes. */
export async function requestBlob(path: string): Promise<Blob> {
  return (await send('GET', path, {})).blob();
}

/** Like `request`, for lists: returns `data` and `meta` together. */
export async function requestPage<T, Meta>(path: string, options: RequestOptions = {}): Promise<{ data: T[]; meta: Meta }> {
  const response = await send('GET', path, options);
  return (await response.json()) as { data: T[]; meta: Meta };
}

/** Downloads a file (the CSV). The token goes in the header, never in the URL. */
export async function download(path: string, filename: string, query?: Query): Promise<void> {
  const response = await send('GET', path, { query });
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, { body: body ?? {} }),
  patch: <T>(path: string, body: unknown): Promise<T> => request<T>('PATCH', path, { body }),
  put: <T>(path: string, file: Blob): Promise<T> => request<T>('PUT', path, { file }),
  postFile: <T>(path: string, file: Blob): Promise<T> => request<T>('POST', path, { file }),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};
