import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { Database, RefreshCw, Plus, Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'

async function getAdminData() {
    const [sources, crawlLogs, tenderCount, userCount] = await Promise.all([
        prisma.source.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.crawlLog.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: { source: { select: { name: true } } },
        }),
        prisma.tender.count(),
        prisma.user.count(),
    ])
    return { sources, crawlLogs, tenderCount, userCount }
}

function CrawlStatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string; color: string; Icon: any }> = {
        SUCCESS: { label: '성공', color: 'text-green-700 bg-green-50 border-green-100', Icon: CheckCircle2 },
        PARTIAL: { label: '부분 성공', color: 'text-yellow-700 bg-yellow-50 border-yellow-100', Icon: AlertTriangle },
        FAILED: { label: '실패', color: 'text-red-700 bg-red-50 border-red-100', Icon: XCircle },
        RUNNING: { label: '실행 중', color: 'text-blue-700 bg-blue-50 border-blue-100', Icon: Activity },
    }
    const cfg = configs[status] || configs.RUNNING
    const { label, color, Icon } = cfg
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    )
}

export default async function AdminPage() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        return <div className="p-6 text-sm text-muted-foreground">접근 권한이 없습니다.</div>
    }

    const { sources, crawlLogs, tenderCount, userCount } = await getAdminData()

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">관리자</h1>
                <p className="page-subtitle">크롤링 소스 관리 및 수집 로그 조회</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: '전체 공고', value: tenderCount, icon: Database },
                        { label: '수집 소스', value: sources.length, icon: RefreshCw },
                        { label: '활성 소스', value: sources.filter((s) => s.isActive).length, icon: CheckCircle2 },
                        { label: '전체 사용자', value: userCount, icon: Activity },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="stat-card">
                            <Icon className="w-5 h-5 text-muted-foreground mb-2" />
                            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Sources table */}
                <div className="bg-white border border-border rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">수집 소스</h2>
                        <a
                            href="/admin/sources/new"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            소스 추가
                        </a>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs text-muted-foreground font-semibold">
                                <th className="text-left px-5 py-2.5">소스명</th>
                                <th className="text-left px-4 py-2.5">유형</th>
                                <th className="text-left px-4 py-2.5">스케줄</th>
                                <th className="text-left px-4 py-2.5">마지막 수집</th>
                                <th className="text-center px-4 py-2.5">상태</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sources.map((source) => (
                                <tr key={source.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-foreground">{source.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{source.url}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{source.sourceType}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{source.cronSchedule || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{source.lastCrawledAt ? formatDateTime(source.lastCrawledAt) : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded border ${source.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {source.isActive ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <form action={`/api/admin/crawl`} method="POST">
                                            <input type="hidden" name="sourceId" value={source.id} />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await fetch('/api/admin/crawl', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ sourceId: source.id }),
                                                    })
                                                }}
                                                className="text-xs px-2.5 py-1 border border-border rounded hover:bg-muted transition-colors"
                                            >
                                                수동 실행
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Crawl logs */}
                <div className="bg-white border border-border rounded-md overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-50 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">수집 로그 (최근 20건)</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs text-muted-foreground font-semibold">
                                <th className="text-left px-5 py-2.5">소스</th>
                                <th className="text-left px-4 py-2.5">시작 시간</th>
                                <th className="text-left px-4 py-2.5">소요 시간</th>
                                <th className="text-center px-4 py-2.5">상태</th>
                                <th className="text-right px-4 py-2.5">신규/수정/중복/오류</th>
                                <th className="text-left px-4 py-2.5">트리거</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {crawlLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-2.5 text-xs font-medium">{log.source?.name || '전체'}</td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDateTime(log.startedAt)}</td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                        {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <CrawlStatusBadge status={log.status} />
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-xs">
                                        <span className="text-green-700">{log.newCreated}↑</span>
                                        {' / '}
                                        <span className="text-blue-600">{log.updated}</span>
                                        {' / '}
                                        <span className="text-muted-foreground">{log.duplicates}</span>
                                        {' / '}
                                        <span className="text-red-600">{log.errors}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.triggeredBy || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
