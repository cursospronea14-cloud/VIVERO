import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname
  const isAuthPage = path === '/login'
  const isAdminPage = path.startsWith('/admin')
  const isPosPage = path.startsWith('/pos')
  const isPublicPath = path === '/' || path === '/favicon.ico' || path.startsWith('/_next') || path.startsWith('/logo')

  // Permitir rutas públicas
  if (isPublicPath) {
    return response
  }

  // Si no hay sesión y no está en login, redirigir a login
  if (!session && !isAuthPage) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión y está en login, redirigir según rol
  if (session && isAuthPage) {
    // Obtener el rol del usuario
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

  // Verificar acceso a admin
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

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.png).*)'],
}
