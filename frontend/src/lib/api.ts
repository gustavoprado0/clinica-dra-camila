const API_PREFIX = '/api/proxy';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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

  // 204 No Content ou 205 Reset Content → sem body
  if (res.status === 204 || res.status === 205) {
    if (!res.ok) {
      throw new Error(`Erro ${res.status}`);
    }
    return undefined as T;
  }

  // Lê como texto primeiro (evita erro se não for JSON)
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errorMsg =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Erro ${res.status}`;
    throw new Error(errorMsg);
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
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};
