import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect / to /dashboard
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // List of public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/reset-password', '/api/auth/callback', '/account-deleted']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Protect all routes except public ones
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup' ||
      request.nextUrl.pathname === '/reset-password')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Check admin access status for authenticated users on protected routes
  if (user && !isPublicRoute) {
    const { data: accessCheck, error: accessError } = await supabase.rpc('check_admin_access')

    if (!accessError && accessCheck) {
      const result = accessCheck as { can_access: boolean; reason: string; message: string }
      
      // If account is deleted, redirect to account-deleted page
      if (!result.can_access && result.reason === 'account_deleted') {
        const url = request.nextUrl.clone()
        url.pathname = '/account-deleted'
        return NextResponse.redirect(url)
      }

      // If user is a member (not admin), prevent access to admin dashboard
      if (!result.can_access && result.reason === 'invalid_role') {
        // Sign out the user and redirect to login with reason
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('reason', 'member_access_denied')
        
        // Clear auth cookies to sign out the user
        const response = NextResponse.redirect(url)
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        // Delete all supabase auth cookies
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.startsWith('sb-')) {
            response.cookies.delete(cookie.name)
          }
        })
        return response
      }

    }
  }

  // Prevent deleted users from navigating away from account-deleted (if they're on it)
  if (user && request.nextUrl.pathname === '/account-deleted') {
    // Allow them to stay on account-deleted page
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

