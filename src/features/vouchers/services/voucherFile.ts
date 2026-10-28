/** Proofs of payment per payment (a payment may be split in several transfers). Same limit as the API. */
export const MAX_VOUCHERS = 5;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
/** What the API accepts after the photo has been shrunk. */
const MAX_SENT_BYTES = 10 * 1024 * 1024;
/** A raw phone photo can be large; it is shrunk before sending, so the limit before that is generous. */
const MAX_PICKED_IMAGE_BYTES = 40 * 1024 * 1024;
/** Photos above this weight, or wider than MAX_SIDE, are shrunk. */
const SHRINK_ABOVE_BYTES = 1024 * 1024;
const MAX_SIDE = 1600;

export const VOUCHER_ACCEPT = ACCEPTED_TYPES.join(',');

/** A Spanish reason why the file cannot be a voucher, or null when it can. */
export function voucherProblem(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `«${file.name}» no es una imagen ni un PDF.`;
  const limit = file.type === 'application/pdf' ? MAX_SENT_BYTES : MAX_PICKED_IMAGE_BYTES;
  if (file.size > limit) return `«${file.name}» pesa demasiado.`;
  return null;
}

/** Shrinks big photos (phone photos weigh several MB) to a readable JPEG; PDFs and small files go as they are. */
export async function prepareVoucher(file: File): Promise<Blob> {
  if (file.type === 'application/pdf') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`No se pudo leer «${file.name}».`);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } finally {
    bitmap.close();
  }
}
