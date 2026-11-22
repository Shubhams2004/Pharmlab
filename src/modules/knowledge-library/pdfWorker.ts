import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { pdfjsLib };

export function classifyPdfError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Unable to process this PDF file. Please verify the file is valid and try again.';
  }

  const record = err as { name?: string; message?: string; code?: number };
  const name = record.name ?? '';
  const msg = (record.message ?? '').toLowerCase();

  if (name === 'PasswordException' || msg.includes('password') || msg.includes('encrypted')) {
    return 'This PDF is password-protected or encrypted. Please upload an unencrypted copy.';
  }

  if (
    name === 'InvalidPDFException' ||
    msg.includes('invalid pdf') ||
    msg.includes('corrupt') ||
    msg.includes('unexpected end') ||
    msg.includes('missing pdf')
  ) {
    return 'The selected file appears to be corrupted, truncated, or is not a valid PDF document.';
  }

  if (name === 'QuotaExceededError' || msg.includes('quota')) {
    return 'Browser storage quota exceeded. Please delete unused books from your library to free space.';
  }

  if (msg.includes('unsupported') || msg.includes('format')) {
    return 'This PDF uses an unsupported encoding or structure and cannot be opened.';
  }

  return record.message || 'An unexpected error occurred while reading the PDF document.';
}
