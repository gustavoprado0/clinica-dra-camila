import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const config = {
  matcher: '/api/proxy/:path*',
};

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/api\/proxy/, '');
  const targetUrl = new URL(`${API_URL}/api${path}`);

  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('accept-encoding');

  let body: BodyInit | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);

    // Remove headers problemáticos
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    // Ajusta cookies
    const setCookies = response.headers.getSetCookie?.() ?? [];
    responseHeaders.delete('set-cookie');
    for (const cookie of setCookies) {
      const cleaned = cookie
        .replace(/;\s*Domain=[^;]+/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
      responseHeaders.append('set-cookie', cleaned);
    }

    // 204 e 304 NÃO podem ter body
    if (response.status === 204 || response.status === 304) {
      return new NextResponse(null, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    // Demais respostas: lê arrayBuffer
    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Erro ao conectar com o servidor' },
      { status: 502 }
    );
  }
}
