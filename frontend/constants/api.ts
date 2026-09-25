export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;

    // During local development assume backend runs on :5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }

    // In production assume API is proxied under the same origin (e.g., /api -> backend)
    return origin;
  }
  return 'http://localhost:5000';
};
