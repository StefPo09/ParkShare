export const getApiBaseUrl = (): string => {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    // Use the Next.js /api rewrite locally, even when NEXT_PUBLIC_API_URL is configured.
    return '';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;

    // In production assume API is proxied under the same origin (e.g., /api -> backend)
    return origin;
  }
  return '';
};
