import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const response = NextResponse.next()
            response.cookies.set(name, value, options)
            return response
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Rutas públicas
  if (path === '/' || path === '/login' || path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Obtener rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role || 'vendedor'

  // Redirigir según rol
  if (path === '/login') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url))
    if (role === 'bodeguero') return NextResponse.redirect(new URL('/bodega', req.url))
    if (role === 'fumigador') return NextResponse.redirect(new URL('/fumigacion', req.url))
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  // Restricciones
  if (role === 'admin') return NextResponse.next()
  if (role === 'bodeguero' && !path.startsWith('/bodega')) {
    return NextResponse.redirect(new URL('/bodega', req.url))
  }
  if (role === 'fumigador' && !path.startsWith('/fumigacion')) {
    return NextResponse.redirect(new URL('/fumigacion', req.url))
  }
  if (role === 'vendedor' && !path.startsWith('/pos')) {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
