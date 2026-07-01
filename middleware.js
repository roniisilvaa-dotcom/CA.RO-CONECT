import { NextResponse } from 'next/server'

// Roteamento por domínio:
// camilarocha.carostudio.com.br  → /camila (bio pública)
// admcamilarocha.carostudio.com.br → /admin (painel de controle)

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl

  // Bio domain — redireciona raiz para /camila
  if (hostname === 'camilarocha.carostudio.com.br') {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/camila', request.url))
    }
    // Bloqueia acesso ao admin pelo domínio da bio
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/camila', request.url))
    }
  }

  // Admin domain — redireciona raiz para /admin
  if (hostname === 'admcamilarocha.carostudio.com.br') {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
