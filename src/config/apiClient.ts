/**
 * The only place that talks HTTP to pulso-api. It adds the bearer token that atm-auth-api issued (the session
 * module provides it and renews it), retries once when the API rejects it, and turns the API's error shape into `ApiError`.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
/** atm-auth-api: login, renewal, logout and password change. The browser calls it directly. */
export const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3130').replace(/\/$/, '');

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

/** Where the client gets the session's token; the auth session installs it so this file knows nothing about atm-auth-api. */
export interface TokenSource {
  /** A valid access token (renewed when about to expire), or null when nobody is signed in. Throws `ApiError` 401 when the session is over. */
  getAccessToken: () => Promise<string | null>;
  /** Asks atm-auth-api for a new access token because pulso-api rejected the current one. */
  forceRefresh: () => Promise<string>;
}

let tokenSource: TokenSource | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokenSource(source: TokenSource | null): void {
  tokenSource = source;
}

/** Called when the session cannot be recovered; the app goes back to the login. */
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

async function fetchOnce(method: string, path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.file) headers['Content-Type'] = options.file.type;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.file ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
  }
}

async function send(method: string, path: string, options: RequestOptions): Promise<Response> {
  let token: string | null;
  try {
    token = (await tokenSource?.getAccessToken()) ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) onUnauthorized?.();
    throw error;
  }
  let response = await fetchOnce(method, path, options, token);
  if (response.status === 401 && token && tokenSource) {
    // The token was revoked or expired early: ask atm-auth-api for a new one and try once more.
    try {
      response = await fetchOnce(method, path, options, await tokenSource.forceRefresh());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized?.();
      throw error;
    }
  }
  if (response.ok) return response;
  const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string; details?: unknown } } | null;
  const apiError = new ApiError(response.status, payload?.error?.code ?? 'UNKNOWN', payload?.error?.message ?? 'Algo salió mal.', payload?.error?.details);
  if (response.status === 401 && token) onUnauthorized?.();
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
