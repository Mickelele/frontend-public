import { NextResponse } from 'next/server';

export function middleware(req) {
    const token = req.cookies.get('token')?.value || null;
    const protectedPaths = ['/dashboard'];

    if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p)) && !token) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
