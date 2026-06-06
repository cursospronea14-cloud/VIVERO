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
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Rutas públicas
  const isPublicPath = 
    path === '/' ||
    path === '/login' ||
    path.startsWith('/product/') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/logo') ||
    path.includes('.')

  if (isPublicPath) {
    return response
  }

  // Si no hay sesión, ir a login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role || 'vendedor'

  // Redirigir según rol si está en login
  if (path === '/login') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
    if (role === 'bodeguero') return NextResponse.redirect(new URL('/bodega', req.url))
    if (role === 'fumigador') return NextResponse.redirect(new URL('/fumigacion', req.url))
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  // Verificar acceso a rutas protegidas
  if (role === 'admin') return response
  
  if (role === 'bodeguero' && !path.startsWith('/bodega')) {
    return NextResponse.redirect(new URL('/bodega', req.url))
  }
  
  if (role === 'fumigador' && !path.startsWith('/fumigacion')) {
    return NextResponse.redirect(new URL('/fumigacion', req.url))
  }
  
  if (role === 'vendedor' && !path.startsWith('/pos')) {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
