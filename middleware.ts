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

  // Si no hay sesión, redirigir a login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Obtener el rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role || 'vendedor'

  // Reglas de redirección según el rol
  // ADMINISTRADOR - todo acceso
  if (userRole === 'admin') {
    if (path === '/pos') return response
    if (path === '/admin') return response
    if (path === '/bodega') return NextResponse.redirect(new URL('/admin', req.url))
    if (path === '/fumigacion') return NextResponse.redirect(new URL('/admin', req.url))
    if (path === '/') return NextResponse.redirect(new URL('/admin', req.url))
    return response
  }

  // GERENTE - similar a admin pero con menos permisos
  if (userRole === 'gerente') {
    if (path === '/admin') return response
    if (path === '/pos') return NextResponse.redirect(new URL('/admin', req.url))
    if (path === '/bodega') return NextResponse.redirect(new URL('/admin', req.url))
    if (path === '/fumigacion') return NextResponse.redirect(new URL('/admin', req.url))
    if (path === '/') return NextResponse.redirect(new URL('/admin', req.url))
    return response
  }

  // VENDEDOR - solo POS
  if (userRole === 'vendedor') {
    if (path === '/pos') return response
    if (path === '/admin') return NextResponse.redirect(new URL('/pos', req.url))
    if (path === '/bodega') return NextResponse.redirect(new URL('/pos', req.url))
    if (path === '/fumigacion') return NextResponse.redirect(new URL('/pos', req.url))
    if (path === '/') return NextResponse.redirect(new URL('/pos', req.url))
    return response
  }

  // BODEGUERO - solo bodega
  if (userRole === 'bodeguero') {
    if (path === '/bodega') return response
    if (path === '/admin') return NextResponse.redirect(new URL('/bodega', req.url))
    if (path === '/pos') return NextResponse.redirect(new URL('/bodega', req.url))
    if (path === '/fumigacion') return NextResponse.redirect(new URL('/bodega', req.url))
    if (path === '/') return NextResponse.redirect(new URL('/bodega', req.url))
    return response
  }

  // FUMIGADOR - solo fumigacion
  if (userRole === 'fumigador') {
    if (path === '/fumigacion') return response
    if (path === '/admin') return NextResponse.redirect(new URL('/fumigacion', req.url))
    if (path === '/pos') return NextResponse.redirect(new URL('/fumigacion', req.url))
    if (path === '/bodega') return NextResponse.redirect(new URL('/fumigacion', req.url))
    if (path === '/') return NextResponse.redirect(new URL('/fumigacion', req.url))
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
