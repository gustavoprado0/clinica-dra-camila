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

  // Copia headers da requisição (exceto os que atrapalham)
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('accept-encoding'); // ← evita compressão que não conseguimos propagar

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

    // Lê o conteúdo COMPLETO como arrayBuffer (descomprimido pelo fetch)
    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers(response.headers);

    // Remove headers que causam problema no Edge Runtime
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    // Ajusta cookies pra ficar no domínio do frontend
    const setCookies = response.headers.getSetCookie?.() ?? [];
    responseHeaders.delete('set-cookie');
    for (const cookie of setCookies) {
      const cleaned = cookie
        .replace(/;\s*Domain=[^;]+/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
      responseHeaders.append('set-cookie', cleaned);
    }

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
