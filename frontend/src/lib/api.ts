// O frontend sempre chama /api/proxy/* (mesma origem).
// O middleware Next.js encaminha pro backend real.
// Em dev, /api/proxy também é interceptado pelo middleware.
const API_PREFIX = '/api/proxy';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Aceita tanto '/api/xxx' quanto 'xxx'
  const cleanPath = path.startsWith('/api/')
    ? path.slice(4)
    : path.startsWith('/')
    ? path
    : `/${path}`;

  const url = `${API_PREFIX}${cleanPath}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
