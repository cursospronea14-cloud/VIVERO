import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname === '/login'
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isPosPage = req.nextUrl.pathname.startsWith('/pos')

  // Si no hay sesión y no está en login, redirigir a login
  if (!session && !isAuthPage) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión y está en login, redirigir según rol
  if (session && isAuthPage) {
    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin' || profile?.role === 'gerente') {
      return NextResponse.redirect(new URL('/admin', req.url))
    } else {
      return NextResponse.redirect(new URL('/pos', req.url))
    }
  }

  // Verificar acceso a rutas de admin
  if (isAdminPage && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'gerente') {
      return NextResponse.redirect(new URL('/pos', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)'],
}
