'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, SortAsc, Globe, Building2, ChevronRight, Loader2, FileSearch } from 'lucide-react'
import { formatDate, formatBudget, getDeadlineStatus } from '@/lib/utils'

interface Tender {
    id: string
    title: string
    titleKo: string | null
    country: string
    issuer: string
    category: string | null
    contractType: string | null
    budget: number | null
    budgetCurrency: string | null
    publishedAt: string | null
    deadlineAt: string | null
    status: string
    summaryShort: string | null
    tags: { tag: { name: string; nameKo: string | null } }[]
}

const COUNTRIES = ['인도네시아', '베트남', '필리핀', '캄보디아', '방글라데시', '파키스탄', '케냐', '에티오피아', '나이지리아', '미얀마']
const CATEGORIES = ['도로', '교량', '상하수도', '건축', '철도', '항만', '에너지', 'ICT']

export default function TendersPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [tenders, setTenders] = useState<Tender[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [country, setCountry] = useState(searchParams.get('country') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [sort, setSort] = useState(searchParams.get('sort') || 'latest')
    const [page, setPage] = useState(1)

    const fetchTenders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                ...(search && { q: search }),
                ...(country && { country }),
                ...(category && { category }),
                sort,
                page: page.toString(),
                limit: '15',
            })
            const res = await fetch(`/api/tenders?${params}`)
            const data = await res.json()
            setTenders(data.tenders)
            setTotal(data.total)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [search, country, category, sort, page])

    useEffect(() => {
        fetchTenders()
    }, [fetchTenders])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchTenders()
    }

    const totalPages = Math.ceil(total / 15)

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">공고 목록</h1>
                <p className="page-subtitle">해외 건설 입찰 공고 ({total.toLocaleString()}건)</p>
            </div>

            <div className="p-6 space-y-4">
                {/* Search + Filters */}
                <div className="bg-white border border-border rounded-md p-4 space-y-3">
                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="공고명, 발주처, 국가, 키워드 검색..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                        >
                            검색
                        </button>
                    </form>

                    {/* Filters */}
                    <div className="filter-section">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">필터:</span>

                        <select
                            value={country}
                            onChange={(e) => { setCountry(e.target.value); setPage(1) }}
                            className="text-xs border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">전체 국가</option>
                            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                            className="text-xs border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">전체 공종</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <div className="ml-auto flex items-center gap-1.5">
                            <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">정렬:</span>
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                                className="text-xs border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                                <option value="latest">최신순</option>
                                <option value="deadline">마감임박순</option>
                                <option value="budget">예산순</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-border rounded-md overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_100px_90px_90px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-border text-xs font-semibold text-muted-foreground">
                        <span>공고명 / 발주처</span>
                        <span>국가</span>
                        <span>예산</span>
                        <span>공고일</span>
                        <span>마감일</span>
                    </div>

                    {loading ? (
                        <div className="py-16 flex flex-col items-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-sm">공고를 불러오는 중...</p>
                        </div>
                    ) : tenders.length === 0 ? (
                        <div className="py-16 flex flex-col items-center text-muted-foreground">
                            <FileSearch className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm font-medium">검색 결과가 없습니다</p>
                            <p className="text-xs mt-1">다른 검색어나 필터를 시도해보세요.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {tenders.map((tender) => {
                                const deadline = getDeadlineStatus(tender.deadlineAt)
                                return (
                                    <Link
                                        key={tender.id}
                                        href={`/tenders/${tender.id}`}
                                        className="grid grid-cols-[1fr_100px_100px_90px_90px] gap-4 px-5 py-3.5 items-center table-row-hover group"
                                    >
                                        {/* Title & issuer */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {tender.category && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                                                        {tender.category}
                                                    </span>
                                                )}
                                                {tender.contractType && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded shrink-0">
                                                        {tender.contractType}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-medium shrink-0 ${deadline.color}`}>
                                                    {deadline.label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {tender.titleKo || tender.title}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <p className="text-xs text-muted-foreground line-clamp-1">{tender.issuer}</p>
                                            </div>
                                        </div>

                                        {/* Country */}
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="text-sm text-foreground">{tender.country}</span>
                                        </div>

                                        {/* Budget */}
                                        <div className="text-sm text-foreground">
                                            {tender.budget ? formatBudget(tender.budget, tender.budgetCurrency) : '-'}
                                        </div>

                                        {/* Published */}
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(tender.publishedAt)}
                                        </div>

                                        {/* Deadline */}
                                        <div className={`text-xs font-medium ${deadline.urgent ? deadline.color : 'text-foreground'}`}>
                                            {formatDate(tender.deadlineAt)}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            총 {total.toLocaleString()}건 중 {((page - 1) * 15 + 1)}-{Math.min(page * 15, total)}건 표시
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-40"
                            >
                                이전
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, page - 2) + i
                                if (p > totalPages) return null
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 text-xs border rounded ${p === page ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                                    >
                                        {p}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-40"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
