'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Bookmark, BookmarkCheck, Globe, Building2,
    Calendar, DollarSign, FileText, ExternalLink, Loader2,
    Paperclip, MessageSquare, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'
import { formatDate, formatDateTime, formatBudget, getDeadlineStatus } from '@/lib/utils'

interface TenderDetail {
    id: string
    title: string
    titleKo: string | null
    projectNumber: string | null
    country: string
    region: string | null
    city: string | null
    issuer: string
    issuerType: string | null
    category: string | null
    contractType: string | null
    budget: number | null
    budgetCurrency: string | null
    budgetText: string | null
    publishedAt: string | null
    deadlineAt: string | null
    status: string
    originalUrl: string | null
    summaryShort: string | null
    summaryLong: string | null
    qualificationText: string | null
    importantNotes: string | null
    aiProcessedAt: string | null
    isBookmarked: boolean
    tags: { tag: { name: string; nameKo: string | null; color: string | null } }[]
    files: { id: string; fileName: string; fileUrl: string; fileType: string | null; fileSizeBytes: number | null; description: string | null }[]
    internalNotes: { id: string; content: string; createdAt: string; user: { name: string | null } }[]
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function TenderDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [tender, setTender] = useState<TenderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [bookmarkLoading, setBookmarkLoading] = useState(false)
    const [showLongSummary, setShowLongSummary] = useState(false)
    const [note, setNote] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)

    useEffect(() => {
        fetchTender()
    }, [id])

    async function fetchTender() {
        try {
            const res = await fetch(`/api/tenders/${id}`)
            if (!res.ok) { setError('공고를 찾을 수 없습니다.'); return }
            const data = await res.json()
            setTender(data)
        } catch {
            setError('데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    async function toggleBookmark() {
        if (!tender) return
        setBookmarkLoading(true)
        try {
            const method = tender.isBookmarked ? 'DELETE' : 'POST'
            await fetch('/api/bookmarks', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenderId: tender.id }),
            })
            setTender((prev) => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null)
        } finally {
            setBookmarkLoading(false)
        }
    }

    async function submitNote(e: React.FormEvent) {
        e.preventDefault()
        if (!note.trim()) return
        setNoteLoading(true)
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenderId: id, content: note }),
            })
            if (res.ok) {
                setNote('')
                fetchTender()
            }
        } finally {
            setNoteLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">공고 정보를 불러오는 중...</p>
            </div>
        )
    }

    if (error || !tender) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mb-2 text-orange-400" />
                <p className="text-sm font-medium">{error || '공고를 찾을 수 없습니다.'}</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
                    ← 목록으로 돌아가기
                </button>
            </div>
        )
    }

    const deadline = getDeadlineStatus(tender.deadlineAt)

    return (
        <div>
            {/* Header */}
            <div className="page-header flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
                        <ArrowLeft className="w-3 h-3" /> 목록으로
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                        {tender.category && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{tender.category}</span>
                        )}
                        {tender.contractType && (
                            <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{tender.contractType}</span>
                        )}
                        <span className={`text-[11px] font-semibold ${deadline.color}`}>{deadline.label}</span>
                    </div>
                    <h1 className="text-base font-semibold text-foreground leading-snug">
                        {tender.titleKo || tender.title}
                    </h1>
                    {tender.titleKo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tender.title}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {tender.originalUrl && (
                        <a
                            href={tender.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            원문 링크
                        </a>
                    )}
                    <button
                        onClick={toggleBookmark}
                        disabled={bookmarkLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${tender.isBookmarked
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'border border-border hover:bg-muted'
                            }`}
                    >
                        {tender.isBookmarked
                            ? <><BookmarkCheck className="w-3.5 h-3.5" /> 북마크됨</>
                            : <><Bookmark className="w-3.5 h-3.5" /> 북마크</>
                        }
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-3 gap-5">
                {/* Left column - main content */}
                <div className="col-span-2 space-y-4">
                    {/* Project info table */}
                    <div className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">공고 기본정보</h2>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                {[
                                    { label: '프로젝트 번호', value: tender.projectNumber || '-', icon: FileText },
                                    { label: '국가 / 지역', value: [tender.country, tender.region, tender.city].filter(Boolean).join(' / '), icon: Globe },
                                    { label: '발주처', value: tender.issuer, icon: Building2 },
                                    { label: '공고일', value: formatDate(tender.publishedAt), icon: Calendar },
                                    { label: '마감일', value: formatDate(tender.deadlineAt), icon: Calendar },
                                    { label: '예산', value: tender.budgetText || formatBudget(tender.budget, tender.budgetCurrency), icon: DollarSign },
                                ].map(({ label, value, icon: Icon }) => (
                                    <tr key={label}>
                                        <td className="px-5 py-2.5 w-32 text-muted-foreground font-medium bg-slate-50/50">
                                            <div className="flex items-center gap-1.5">
                                                <Icon className="w-3.5 h-3.5" />
                                                {label}
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-foreground">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* AI Summary */}
                    {(tender.summaryShort || tender.summaryLong) && (
                        <div className="bg-white border border-border rounded-md overflow-hidden">
                            <div className="px-5 py-3 bg-blue-50 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-blue-900">AI 요약</h2>
                                    {tender.aiProcessedAt && (
                                        <p className="text-[10px] text-blue-600 mt-0.5">분석일: {formatDateTime(tender.aiProcessedAt)}</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Short summary */}
                                {tender.summaryShort && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">핵심 요약 (3줄)</p>
                                        <p className="text-sm text-foreground leading-relaxed bg-blue-50/50 px-4 py-3 rounded border-l-4 border-primary">
                                            {tender.summaryShort}
                                        </p>
                                    </div>
                                )}

                                {/* Long summary toggle */}
                                {tender.summaryLong && (
                                    <div>
                                        <button
                                            onClick={() => setShowLongSummary(!showLongSummary)}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                                        >
                                            {showLongSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            상세 요약
                                        </button>
                                        {showLongSummary && (
                                            <p className="text-sm text-foreground leading-relaxed mt-2 whitespace-pre-line">
                                                {tender.summaryLong}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Qualification */}
                                {tender.qualificationText && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">참가 자격</p>
                                        <p className="text-sm text-foreground leading-relaxed">{tender.qualificationText}</p>
                                    </div>
                                )}

                                {/* Important notes */}
                                {tender.importantNotes && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                                        <p className="text-xs font-semibold text-amber-700 mb-1">⚠ 주의사항 / 리스크</p>
                                        <p className="text-sm text-amber-800 leading-relaxed">{tender.importantNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Internal notes */}
                    <div className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">
                                <MessageSquare className="w-4 h-4 inline mr-1.5 mb-0.5" />
                                내부 메모
                            </h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {tender.internalNotes.length > 0 ? (
                                tender.internalNotes.map((n) => (
                                    <div key={n.id} className="p-3 bg-slate-50 rounded border border-border">
                                        <p className="text-sm text-foreground">{n.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            {n.user.name} · {formatDateTime(n.createdAt)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">메모가 없습니다.</p>
                            )}
                            <form onSubmit={submitNote} className="mt-3 space-y-2">
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="내부 메모를 입력하세요..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button
                                    type="submit"
                                    disabled={noteLoading || !note.trim()}
                                    className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {noteLoading ? '저장 중...' : '메모 저장'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right column - sidebar */}
                <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-white border border-border rounded-md p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">공고 상태</h3>
                        <div className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${tender.status === 'OPEN' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                            {tender.status === 'OPEN' ? '진행중' : '마감'}
                        </div>
                        {tender.deadlineAt && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground">마감까지</p>
                                <p className={`text-lg font-bold ${deadline.color}`}>{deadline.label}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(tender.deadlineAt)}</p>
                            </div>
                        )}
                    </div>

                    {/* Files */}
                    {tender.files.length > 0 && (
                        <div className="bg-white border border-border rounded-md overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    <Paperclip className="w-3.5 h-3.5 inline mr-1" />
                                    첨부파일 ({tender.files.length})
                                </h3>
                            </div>
                            <ul className="divide-y divide-border">
                                {tender.files.map((file) => (
                                    <li key={file.id}>
                                        <a
                                            href={file.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-foreground hover:text-primary line-clamp-1">{file.fileName}</p>
                                                {file.description && <p className="text-[10px] text-muted-foreground">{file.description}</p>}
                                                {file.fileSizeBytes && (
                                                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.fileSizeBytes)}</p>
                                                )}
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Tags */}
                    {tender.tags.length > 0 && (
                        <div className="bg-white border border-border rounded-md p-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">태그</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {tender.tags.map(({ tag }) => (
                                    <span
                                        key={tag.name}
                                        className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                                    >
                                        {tag.nameKo || tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
