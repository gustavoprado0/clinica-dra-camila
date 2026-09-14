import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const config = {
  matcher: '/api/proxy/:path*',
};

export async function middleware(req: NextRequest) {
  // Pega o path depois de /api/proxy
  const path = req.nextUrl.pathname.replace(/^\/api\/proxy/, '');

  // Monta a URL de destino
  const targetUrl = new URL(`${API_URL}/api${path}`);

  // Copia query params
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Prepara headers pra repassar
  const headers = new Headers(req.headers);
  headers.delete('host');

  // Encaminha o body
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

    // Copia headers da resposta
    const responseHeaders = new Headers(response.headers);

    // Ajusta cookies pra ficar no domínio do frontend
    const setCookies = response.headers.getSetCookie?.() ?? [];
    responseHeaders.delete('set-cookie');
    for (const cookie of setCookies) {
      // Remove atributos que possam conflitar
      const cleaned = cookie
        .replace(/;\s*Domain=[^;]+/gi, '')
        .replace(/;\s*Secure/gi, '; Secure')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
      responseHeaders.append('set-cookie', cleaned);
    }

    return new NextResponse(response.body, {
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
