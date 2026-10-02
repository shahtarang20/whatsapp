import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  // 1. Protect Admin Route (Block non-admins and logged-out users)
  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Protect Client Dashboard (Block logged-out users)
  if (path === '/') {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Redirect authenticated users away from the login page if they are already logged in
  if (path === '/login' && role) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Specify exactly which routes this security middleware should watch over
export const config = {
  matcher: ['/', '/admin/:path*', '/login'],
};
