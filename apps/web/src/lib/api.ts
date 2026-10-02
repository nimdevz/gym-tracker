const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();
  if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, credentials: 'include', headers });

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errBody = await response.json();
      if (errBody?.error) errorMsg = errBody.error;
      else if (errBody?.message) errorMsg = errBody.message;
    } catch {}
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/')) {
      // Leave redirect decision to callers; surface clear message
      throw new Error('Unauthorized: please sign in again');
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export { API_BASE_URL };
