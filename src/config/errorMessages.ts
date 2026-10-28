import { ApiError } from '@/config/apiClient';

/** Spanish text for the API's stable error codes. Unknown codes fall back to the API's own message. */
const messages: Record<string, string> = {
  NETWORK_ERROR: 'No se pudo conectar con el servidor. Revisa tu conexión.',
  INVALID_CREDENTIALS: 'DNI o contraseña incorrectos.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento.',
  CURRENT_PASSWORD_INCORRECT: 'La contraseña actual no es correcta.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  PASSWORD_UNCHANGED: 'La nueva contraseña debe ser distinta de la actual.',
  FORBIDDEN: 'No tienes permiso para hacer esto.',
  NOT_FOUND: 'Este registro ya no existe.',
  USER_DOCUMENT_TAKEN: 'Este DNI ya pertenece a un usuario.',
  MEMBER_DOCUMENT_TAKEN: 'Este documento ya pertenece a un miembro.',
  MEMBER_NOT_FOUND: 'El miembro ya no existe.',
  ROLE_NOT_ASSIGNABLE: 'No puedes asignar este rol.',
  SCOPE_NOT_ALLOWED: 'No puedes administrar este gimnasio o sede.',
  CANNOT_MODIFY_SELF: 'No puedes modificar tu propia cuenta aquí.',
  CANNOT_MODIFY_OWNER: 'Solo Atmósfera puede modificar al dueño.',
  BRANCH_NOT_ACCESSIBLE: 'No tienes acceso a esta sede.',
  ACCESS_BRANCHES_INVALID: 'Las sedes de acceso no son válidas.',
  EXPORT_TOO_LARGE: 'Hay demasiados pagos para descargar. Acota las fechas.',
  DOCUMENT_NOT_FOUND: 'No se encontraron datos para este documento.',
  LOOKUP_UNAVAILABLE: 'La búsqueda no está disponible ahora. Escribe los datos a mano.',
  CONFLICT: 'Este registro ya existe.',
  STORAGE_UNAVAILABLE: 'El almacenamiento de imágenes no está disponible. Inténtalo más tarde.',
};

const fieldMessages: Record<string, string> = {
  DOCUMENT_NUMBER_INVALID: 'El número de documento no es válido.',
  DOCUMENT_TYPE_INVALID: 'Elige el tipo de documento.',
  FULL_NAME_INVALID: 'Ingresa un nombre válido (3 a 120 letras).',
  PHONE_INVALID: 'El celular debe tener 9 dígitos y empezar con 9.',
  MONTHS_INVALID: 'Elige entre 1 y 24 meses.',
  START_DATE_INVALID: 'La fecha de inicio no es válida.',
  AMOUNT_INVALID: 'El importe no es válido.',
  AMOUNT_NOT_ALLOWED: 'El pase del día tiene el precio fijo del gimnasio.',
  METHOD_INVALID: 'Elige un medio de pago.',
  EMAIL_INVALID: 'El correo no es válido.',
  TAX_ID_INVALID: 'El RUC debe tener 11 dígitos.',
  BRAND_COLOR_INVALID: 'El color no es válido.',
  LOGO_TYPE_INVALID: 'El logo debe ser una imagen PNG, JPG o WebP.',
  LOGO_SIZE_INVALID: 'El logo debe pesar como máximo 512 KB.',
  PRICE_INVALID: 'El precio no es válido.',
  BRANCHES_REQUIRED: 'Selecciona al menos una sede.',
  RANGE_INVALID: 'El rango de fechas no es válido (máximo 366 días).',
};

/** A message the user can read for any error thrown while talking to the API. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.';
  const issue = error.fieldIssues[0];
  if (issue && fieldMessages[issue.code]) return fieldMessages[issue.code];
  return messages[error.code] ?? error.message;
}
