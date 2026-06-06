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

  // Rutas públicas (accesibles sin login)
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
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Obtener el rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role || 'vendedor'

  // Si está en login, redirigir según su rol
  if (path === '/login') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    } else if (userRole === 'bodeguero') {
      return NextResponse.redirect(new URL('/bodega', req.url))
    } else if (userRole === 'fumigador') {
      return NextResponse.redirect(new URL('/fumigacion', req.url))
    } else {
      return NextResponse.redirect(new URL('/pos', req.url))
    }
  }

  // Verificar acceso según el rol
  if (userRole === 'admin') {
    return response
  }

  if (userRole === 'bodeguero' && !path.startsWith('/bodega')) {
    return NextResponse.redirect(new URL('/bodega', req.url))
  }

  if (userRole === 'fumigador' && !path.startsWith('/fumigacion')) {
    return NextResponse.redirect(new URL('/fumigacion', req.url))
  }

  if (userRole === 'vendedor' && !path.startsWith('/pos')) {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
