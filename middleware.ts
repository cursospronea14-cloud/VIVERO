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

  // Si no hay sesión y la ruta es protegida, redirigir a login
  if (!session) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Obtener el rol del usuario
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error obteniendo perfil:', error)
    // Si hay error, redirigir a login
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  const userRole = profile?.role || 'vendedor'
  console.log('Usuario:', session.user.email, 'Rol:', userRole, 'Path:', path)

  // Si está en login y tiene sesión, redirigir según su rol
  if (path === '/login') {
    if (userRole === 'admin' || userRole === 'gerente') {
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
  // ADMIN - puede ir a admin y pos
  if (userRole === 'admin') {
    if (path === '/admin' || path === '/pos') {
      return response
    }
    // Redirigir a admin si intenta ir a otro lado
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // GERENTE - puede ir a admin
  if (userRole === 'gerente') {
    if (path === '/admin') {
      return response
    }
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // VENDEDOR - solo puede ir a pos
  if (userRole === 'vendedor') {
    if (path === '/pos') {
      return response
    }
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  // BODEGUERO - solo puede ir a bodega
  if (userRole === 'bodeguero') {
    if (path === '/bodega') {
      return response
    }
    return NextResponse.redirect(new URL('/bodega', req.url))
  }

  // FUMIGADOR - solo puede ir a fumigacion
  if (userRole === 'fumigador') {
    if (path === '/fumigacion') {
      return response
    }
    return NextResponse.redirect(new URL('/fumigacion', req.url))
  }

  // Por defecto, redirigir a pos
  return NextResponse.redirect(new URL('/pos', req.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
