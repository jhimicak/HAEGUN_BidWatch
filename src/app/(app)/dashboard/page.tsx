import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { formatDate, getDaysUntil, formatBudget } from '@/lib/utils'
import {
    FileText, Clock, Bell, TrendingUp, ExternalLink, ChevronRight, Globe, Building2
} from 'lucide-react'

async function getDashboardData(userId: string) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in7days = new Date(now.getTime() + 7 * 86400000)

    const [
        todayCount,
        urgentCount,
        alertMatchCount,
        recentTenders,
        totalOpen,
    ] = await Promise.all([
        prisma.tender.count({
            where: { publishedAt: { gte: todayStart }, status: 'OPEN' },
        }),
        prisma.tender.count({
            where: { deadlineAt: { gte: now, lte: in7days }, status: 'OPEN' },
        }),
        prisma.bookmark.count({ where: { userId } }),
        prisma.tender.findMany({
            where: { status: 'OPEN' },
            orderBy: { publishedAt: 'desc' },
            take: 8,
            include: {
                tags: { include: { tag: true } },
            },
        }),
        prisma.tender.count({ where: { status: 'OPEN' } }),
    ])

    return { todayCount, urgentCount, alertMatchCount, recentTenders, totalOpen }
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id ?? ''
    const { todayCount, urgentCount, alertMatchCount, recentTenders, totalOpen } = await getDashboardData(userId)

    const stats = [
        {
            label: '오늘 신규 공고',
            value: todayCount,
            sub: '신규 등록',
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            href: '/tenders?sort=latest',
        },
        {
            label: '마감 임박 (7일 이내)',
            value: urgentCount,
            sub: '신속 검토 필요',
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            href: '/tenders?sort=deadline',
        },
        {
            label: '내 북마크',
            value: alertMatchCount,
            sub: '저장된 공고',
            icon: Bell,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: '/bookmarks',
        },
        {
            label: '전체 진행 공고',
            value: totalOpen,
            sub: '활성 공고 수',
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            href: '/tenders',
        },
    ]

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">대시보드</h1>
                <p className="page-subtitle">{session?.user?.name}님, 오늘의 해외 입찰 현황입니다.</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Link key={stat.href} href={stat.href} className="stat-card group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-md ${stat.bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                                <p className="text-sm font-medium text-foreground mt-0.5">{stat.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                            </Link>
                        )
                    })}
                </div>

                {/* Recent tenders */}
                <div className="bg-white border border-border rounded-md">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">최근 공고</h2>
                        <Link href="/tenders" className="text-xs text-primary hover:underline flex items-center gap-1">
                            전체 보기 <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {recentTenders.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            등록된 공고가 없습니다.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentTenders.map((tender) => {
                                const days = getDaysUntil(tender.deadlineAt)
                                const isUrgent = days !== null && days >= 0 && days <= 7

                                return (
                                    <Link
                                        key={tender.id}
                                        href={`/tenders/${tender.id}`}
                                        className="flex items-start px-5 py-3.5 hover:bg-muted/50 transition-colors group"
                                    >
                                        {/* Left */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {tender.category && (
                                                    <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                        {tender.category}
                                                    </span>
                                                )}
                                                {isUrgent && (
                                                    <span className="badge-urgent">D-{days}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {tender.titleKo || tender.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {tender.country}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {tender.issuer.length > 30 ? tender.issuer.slice(0, 30) + '...' : tender.issuer}
                                                </span>
                                                {tender.budget && (
                                                    <span>{formatBudget(Number(tender.budget), tender.budgetCurrency)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right */}
                                        <div className="ml-4 text-right flex-shrink-0">
                                            <p className="text-xs text-muted-foreground">공고일</p>
                                            <p className="text-xs font-medium">{formatDate(tender.publishedAt)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">마감</p>
                                            <p className={`text-xs font-medium ${isUrgent ? 'text-orange-600' : ''}`}>
                                                {formatDate(tender.deadlineAt)}
                                            </p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
