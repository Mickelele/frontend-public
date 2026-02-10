import { NextResponse } from 'next/server';

export function middleware(req) {
    const accessToken = req.cookies.get('accessToken')?.value || null;
    const protectedPaths = ['/dashboard'];

    if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p)) && !accessToken) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
