import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { formatDate, formatBudget, getDeadlineStatus } from '@/lib/utils'
import { Bookmark, Globe, Building2, FileSearch } from 'lucide-react'

export default async function BookmarksPage() {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    const bookmarks = await prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            tender: {
                include: {
                    tags: { include: { tag: true } },
                },
            },
        },
    })

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">북마크</h1>
                <p className="page-subtitle">저장한 입찰 공고 ({bookmarks.length}건)</p>
            </div>

            <div className="p-6">
                {bookmarks.length === 0 ? (
                    <div className="bg-white border border-border rounded-md py-16 flex flex-col items-center text-muted-foreground">
                        <Bookmark className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm font-medium">북마크한 공고가 없습니다.</p>
                        <p className="text-xs mt-1">공고 상세페이지에서 북마크 버튼을 눌러 저장하세요.</p>
                        <Link href="/tenders" className="mt-4 text-xs text-primary hover:underline">공고 목록 보기 →</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookmarks.map(({ id: bookmarkId, tender, note, createdAt }) => {
                            const deadline = getDeadlineStatus(tender.deadlineAt)
                            return (
                                <div key={bookmarkId} className="bg-white border border-border rounded-md p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                {tender.category && (
                                                    <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tender.category}</span>
                                                )}
                                                {tender.contractType && (
                                                    <span className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tender.contractType}</span>
                                                )}
                                                <span className={`text-[11px] font-semibold ${deadline.color}`}>{deadline.label}</span>
                                            </div>
                                            <Link href={`/tenders/${tender.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                                                {tender.titleKo || tender.title}
                                            </Link>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{tender.country}</span>
                                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{tender.issuer.length > 40 ? tender.issuer.slice(0, 40) + '...' : tender.issuer}</span>
                                                {tender.budget && <span>{formatBudget(Number(tender.budget), tender.budgetCurrency)}</span>}
                                            </div>
                                            {note && (
                                                <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                                                    📌 {note}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0 space-y-1">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground">공고일</p>
                                                <p className="text-xs">{formatDate(tender.publishedAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground">마감일</p>
                                                <p className={`text-xs font-medium ${deadline.urgent ? deadline.color : ''}`}>{formatDate(tender.deadlineAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground">북마크</p>
                                                <p className="text-xs">{formatDate(createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
