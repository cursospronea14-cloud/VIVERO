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

  // Si no hay sesión y la ruta es protegida
  if (!session) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Verificar rol para admin
  if (path.startsWith('/admin')) {
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
  matcher: ['/((?!api|_next/static|_next/image).*)'],
}
