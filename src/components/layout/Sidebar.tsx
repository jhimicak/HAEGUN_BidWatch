'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    FileText,
    Bookmark,
    Bell,
    Settings,
    LogOut,
    ShieldCheck,
    ChevronRight,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { href: '/tenders', label: '공고 목록', icon: FileText },
    { href: '/bookmarks', label: '북마크', icon: Bookmark },
    { href: '/alerts', label: '알림 규칙', icon: Bell },
]

const adminItems = [
    { href: '/admin', label: '관리자', icon: ShieldCheck },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'MANAGER'

    return (
        <aside className="w-56 bg-white border-r border-border flex flex-col h-full fixed left-0 top-0 z-30">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">해건 비드워치</p>
                        <p className="text-[10px] text-muted-foreground">BidWatch</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                        </Link>
                    )
                })}

                {isAdmin && (
                    <>
                        <div className="pt-3 pb-1">
                            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">관리</p>
                        </div>
                        {adminItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive')}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{item.label}</span>
                                    {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* User */}
            <div className="px-2 py-3 border-t border-border">
                <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{session?.user?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={cn('sidebar-link sidebar-link-inactive w-full')}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>로그아웃</span>
                </button>
            </div>
        </aside>
    )
}
