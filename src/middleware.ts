import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const pathname = req.nextUrl.pathname

        // Admin routes protection
        if (pathname.startsWith('/admin') && token?.role !== 'ADMIN' && token?.role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/tenders/:path*',
        '/bookmarks/:path*',
        '/alerts/:path*',
        '/admin/:path*',
        '/api/tenders/:path*',
        '/api/bookmarks/:path*',
        '/api/alert-rules/:path*',
        '/api/admin/:path*',
        '/api/ai/:path*',
        '/api/notifications/:path*',
    ],
}
