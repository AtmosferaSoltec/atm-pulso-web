/** Proofs of payment per payment, product sale or collection: exactly one. Same limit as the API. */
export const MAX_VOUCHERS = 1;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
/** What the API accepts: 2 MB, after the photo has been shrunk. */
export const MAX_SENT_BYTES = 2 * 1024 * 1024;
/** A raw phone photo can be large; it is shrunk before sending, so the limit before that is generous. */
const MAX_PICKED_IMAGE_BYTES = 40 * 1024 * 1024;
/** Longest side of a photo sent as a voucher, in pixels. */
export const MAX_SIDE = 1280;
/** JPEG quality of a shrunk photo: plenty to read a transfer, and ~200 KB. */
export const JPEG_QUALITY = 0.6;

export const VOUCHER_ACCEPT = ACCEPTED_TYPES.join(',');

/** A file that cannot be sent as a voucher; its message is Spanish and meant for the user. */
export class VoucherFileError extends Error {}

/** A Spanish reason why the file cannot be a voucher, or null when it can. */
export function voucherProblem(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `«${file.name}» no es una imagen ni un PDF.`;
  if (file.type === 'application/pdf' && file.size > MAX_SENT_BYTES) return `«${file.name}» pesa más de 2 MB. Envía un PDF más liviano o una foto del comprobante.`;
  if (file.size > MAX_PICKED_IMAGE_BYTES) return `«${file.name}» pesa demasiado.`;
  return null;
}

/** The size a photo is drawn at: its long side at most MAX_SIDE, never enlarged. */
export function shrunkSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Whether a voucher about to be sent fits the API's limit. */
export function fitsUpload(size: number): boolean {
  return size > 0 && size <= MAX_SENT_BYTES;
}

/**
 * Photos are always redrawn with the long side at most 1280 px and re-encoded as JPEG (quality 0.6); a small photo
 * that was already lighter than its JPEG goes as it is. PDFs go as they are. Throws a Spanish message when the
 * result still weighs more than 2 MB.
 */
export async function prepareVoucher(file: File): Promise<Blob> {
  if (file.type === 'application/pdf') {
    if (!fitsUpload(file.size)) throw new VoucherFileError(voucherProblem(file) ?? `«${file.name}» pesa más de 2 MB.`);
    return file;
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new VoucherFileError(`No se pudo leer «${file.name}».`);
  let result: Blob = file;
  try {
    const size = shrunkSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
      const unchangedSize = size.width === bitmap.width && size.height === bitmap.height;
      if (jpeg && !(unchangedSize && file.size <= jpeg.size)) result = jpeg;
    }
  } finally {
    bitmap.close();
  }
  if (!fitsUpload(result.size)) throw new VoucherFileError(`«${file.name}» pesa más de 2 MB incluso reducida. Recorta la imagen o envía otra.`);
  return result;
}
