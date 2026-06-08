import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
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

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Obtener rol del usuario
  let userRole = 'vendedor'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile) {
      userRole = profile.role || 'vendedor'
    }
  } catch (err) {
    console.error('Error al obtener rol:', err)
  }

  // Si está en login, redirigir según su rol
  if (path === '/login') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (userRole === 'bodeguero') {
      return NextResponse.redirect(new URL('/bodega', req.url))
    }
    if (userRole === 'fumigador') {
      return NextResponse.redirect(new URL('/fumigacion', req.url))
    }
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  // Restricciones de acceso según rol
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
