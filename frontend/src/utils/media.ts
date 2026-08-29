/**
 * Utility to resolve browser-accessible media and photograph URLs.
 * Correctly formats local /uploads paths to the configured API server (port 3000)
 * while preserving full http/https URLs, blobs, and data URIs.
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${cleanPath}`;
}
