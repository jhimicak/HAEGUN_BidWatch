'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Bookmark, BookmarkCheck, Globe, Building2,
    Calendar, DollarSign, FileText, ExternalLink, Loader2,
    Paperclip, MessageSquare, ChevronDown, ChevronUp, AlertTriangle,
    Sparkles, ScrollText, Tag, Hash, Zap
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
    rawContent: { rawText: string; charCount: number | null } | null
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
    const [showRawText, setShowRawText] = useState(false)
    const [note, setNote] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiMsg, setAiMsg] = useState('')

    useEffect(() => { fetchTender() }, [id])

    async function fetchTender() {
        try {
            const res = await fetch(`/api/tenders/${id}`)
            if (!res.ok) { setError('공고를 찾을 수 없습니다.'); return }
            setTender(await res.json())
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
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenderId: tender.id }),
            })
            setTender((prev) => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null)
        } finally { setBookmarkLoading(false) }
    }

    async function generateAISummary() {
        if (!tender) return
        setAiLoading(true)
        setAiMsg('')
        try {
            const res = await fetch(`/api/tenders/${id}/summarize`, { method: 'POST' })
            if (res.ok) {
                setAiMsg('✅ AI 요약이 생성됐습니다!')
                fetchTender()
            } else {
                const data = await res.json()
                setAiMsg(data.error || '요약 생성에 실패했습니다.')
            }
        } catch {
            setAiMsg('서버 오류가 발생했습니다.')
        } finally {
            setAiLoading(false)
            setTimeout(() => setAiMsg(''), 5000)
        }
    }

    async function submitNote(e: React.FormEvent) {
        e.preventDefault()
        if (!note.trim()) return
        setNoteLoading(true)
        try {
            const res = await fetch('/api/notes', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenderId: id, content: note }),
            })
            if (res.ok) { setNote(''); fetchTender() }
        } finally { setNoteLoading(false) }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">공고 정보를 불러오는 중...</p>
        </div>
    )

    if (error || !tender) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mb-2 text-orange-400" />
            <p className="text-sm font-medium">{error || '공고를 찾을 수 없습니다.'}</p>
            <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
                ← 목록으로 돌아가기
            </button>
        </div>
    )

    const deadline = getDeadlineStatus(tender.deadlineAt)
    const hasAI = !!(tender.summaryShort || tender.summaryLong || tender.qualificationText)
    const rawText = tender.rawContent?.rawText || ''

    return (
        <div>
            {/* Header */}
            <div className="page-header flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
                        <ArrowLeft className="w-3 h-3" /> 목록으로
                    </button>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {tender.category && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{tender.category}</span>
                        )}
                        {tender.contractType && (
                            <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{tender.contractType}</span>
                        )}
                        {tender.issuer && (
                            <span className="text-[11px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-medium">{tender.issuer}</span>
                        )}
                        <span className={`text-[11px] font-semibold ${deadline.color}`}>{deadline.label}</span>
                    </div>
                    <h1 className="text-base font-semibold text-foreground leading-snug">
                        {tender.titleKo || tender.title}
                    </h1>
                    {tender.titleKo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tender.title}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {tender.originalUrl && (
                        <a
                            href={tender.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            원문 링크
                        </a>
                    )}
                    <button
                        onClick={toggleBookmark}
                        disabled={bookmarkLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${tender.isBookmarked
                            ? 'bg-amber-400 text-white hover:bg-amber-500'
                            : 'border border-border hover:bg-muted'}`}
                    >
                        {tender.isBookmarked
                            ? <><BookmarkCheck className="w-3.5 h-3.5" /> 북마크됨</>
                            : <><Bookmark className="w-3.5 h-3.5" /> 북마크</>}
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-3 gap-5">
                {/* ── Left: main content ── */}
                <div className="col-span-2 space-y-4">

                    {/* 기본정보 */}
                    <div className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">📋 공고 기본정보</h2>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                {[
                                    { label: '프로젝트 번호', value: tender.projectNumber, icon: Hash },
                                    { label: '국가 / 지역', value: [tender.country, tender.region, tender.city].filter(Boolean).join(' / '), icon: Globe },
                                    { label: '발주처', value: tender.issuer, icon: Building2 },
                                    { label: '발주처 유형', value: tender.issuerType, icon: Building2 },
                                    { label: '공고일', value: formatDate(tender.publishedAt), icon: Calendar },
                                    { label: '마감일', value: formatDate(tender.deadlineAt), icon: Calendar },
                                    { label: '예산', value: tender.budgetText || formatBudget(tender.budget, tender.budgetCurrency), icon: DollarSign },
                                    { label: '계약 방식', value: tender.contractType, icon: FileText },
                                ].filter(({ value }) => value && value !== '-').map(({ label, value, icon: Icon }) => (
                                    <tr key={label}>
                                        <td className="px-5 py-2.5 w-36 text-muted-foreground font-medium bg-slate-50/50">
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

                    {/* AI 요약 섹션 */}
                    <div className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-violet-50 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-blue-900 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-violet-500" />
                                    AI 분석 요약
                                </h2>
                                {tender.aiProcessedAt && (
                                    <p className="text-[10px] text-blue-500 mt-0.5">분석일: {formatDateTime(tender.aiProcessedAt)}</p>
                                )}
                            </div>
                            {!hasAI && (
                                <button
                                    onClick={generateAISummary}
                                    disabled={aiLoading}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-60 transition-colors"
                                >
                                    {aiLoading
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 생성 중...</>
                                        : <><Zap className="w-3.5 h-3.5" /> AI 요약 생성</>}
                                </button>
                            )}
                        </div>
                        <div className="p-5">
                            {aiMsg && (
                                <p className={`text-xs mb-3 px-3 py-2 rounded ${aiMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {aiMsg}
                                </p>
                            )}

                            {hasAI ? (
                                <div className="space-y-4">
                                    {tender.summaryShort && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">핵심 요약</p>
                                            <p className="text-sm text-foreground leading-relaxed bg-blue-50/60 px-4 py-3 rounded border-l-4 border-primary">
                                                {tender.summaryShort}
                                            </p>
                                        </div>
                                    )}
                                    {tender.summaryLong && (
                                        <div>
                                            <button
                                                onClick={() => setShowLongSummary(!showLongSummary)}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors mb-1"
                                            >
                                                {showLongSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                상세 요약
                                            </button>
                                            {showLongSummary && (
                                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mt-2">
                                                    {tender.summaryLong}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {tender.qualificationText && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">참가 자격 요건</p>
                                            <p className="text-sm text-foreground leading-relaxed">{tender.qualificationText}</p>
                                        </div>
                                    )}
                                    {tender.importantNotes && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                                            <p className="text-xs font-semibold text-amber-700 mb-1">⚠ 주의사항 / 리스크</p>
                                            <p className="text-sm text-amber-800 leading-relaxed">{tender.importantNotes}</p>
                                        </div>
                                    )}
                                    {/* Re-generate button */}
                                    <div className="pt-1 flex items-center gap-3">
                                        <button
                                            onClick={generateAISummary}
                                            disabled={aiLoading}
                                            className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border rounded hover:bg-muted disabled:opacity-60 transition-colors"
                                        >
                                            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                            재생성
                                        </button>
                                        {aiMsg && <span className="text-xs text-green-600">{aiMsg}</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-violet-200" />
                                    <p className="text-sm font-medium">AI 요약이 아직 없습니다</p>
                                    <p className="text-xs mt-1">
                                        위의 &ldquo;AI 요약 생성&rdquo; 버튼을 클릭하면<br />
                                        OpenAI가 공고 내용을 분석해 요약을 생성합니다.
                                    </p>
                                    {!process.env.OPENAI_API_KEY && (
                                        <p className="text-xs mt-2 text-orange-500">
                                            ※ OPENAI_API_KEY 환경변수 설정 필요
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 원문 내용 */}
                    {rawText && (
                        <div className="bg-white border border-border rounded-md overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 border-b border-border flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                    <ScrollText className="w-4 h-4 text-slate-400" />
                                    원문 내용
                                    {tender.rawContent?.charCount && (
                                        <span className="text-xs text-muted-foreground font-normal ml-1">
                                            ({(tender.rawContent.charCount / 1000).toFixed(1)}K 자)
                                        </span>
                                    )}
                                </h2>
                                <button
                                    onClick={() => setShowRawText(!showRawText)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showRawText ? <><ChevronUp className="w-3.5 h-3.5" /> 접기</> : <><ChevronDown className="w-3.5 h-3.5" /> 펼치기</>}
                                </button>
                            </div>
                            {showRawText && (
                                <div className="p-5">
                                    <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words bg-slate-50 rounded p-4 max-h-96 overflow-y-auto font-sans">
                                        {rawText.slice(0, 5000)}
                                        {rawText.length > 5000 && (
                                            <span className="text-muted-foreground">\n\n... (내용 일부 생략, 원문 링크에서 전체 내용 확인)</span>
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 내부 메모 */}
                    <div className="bg-white border border-border rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" />
                                내부 메모
                                {tender.internalNotes.length > 0 && (
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                        {tender.internalNotes.length}
                                    </span>
                                )}
                            </h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {tender.internalNotes.length > 0 ? (
                                tender.internalNotes.map((n) => (
                                    <div key={n.id} className="p-3 bg-amber-50 rounded border border-amber-100">
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
                                    placeholder="팀 내부 메모를 입력하세요 (분석 의견, 참가 여부 결정 등)"
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

                {/* ── Right: sidebar ── */}
                <div className="space-y-4">
                    {/* 상태 카드 */}
                    <div className="bg-white border border-border rounded-md p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">공고 상태</h3>
                        <div className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${tender.status === 'OPEN'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {tender.status === 'OPEN' ? '🟢 진행중' : '⚫ 마감'}
                        </div>
                        {tender.deadlineAt && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground">마감까지</p>
                                <p className={`text-2xl font-bold ${deadline.color}`}>{deadline.label}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(tender.deadlineAt)}</p>
                            </div>
                        )}
                        {tender.originalUrl && (
                            <a
                                href={tender.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                원문 사이트로 이동
                            </a>
                        )}
                    </div>

                    {/* 첨부파일 */}
                    {tender.files.length > 0 && (
                        <div className="bg-white border border-border rounded-md overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <Paperclip className="w-3.5 h-3.5" />
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
                                                <p className="text-xs font-medium text-foreground hover:text-primary line-clamp-2">{file.fileName}</p>
                                                {file.description && <p className="text-[10px] text-muted-foreground">{file.description}</p>}
                                                {file.fileSizeBytes && <p className="text-[10px] text-muted-foreground">{formatFileSize(file.fileSizeBytes)}</p>}
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 태그 */}
                    {tender.tags.length > 0 && (
                        <div className="bg-white border border-border rounded-md p-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" /> 태그
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {tender.tags.map(({ tag }) => (
                                    <span
                                        key={tag.name}
                                        className="text-xs px-2 py-0.5 rounded-full text-white"
                                        style={{ backgroundColor: tag.color || '#6B7280' }}
                                    >
                                        {tag.nameKo || tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 공고 메타 */}
                    <div className="bg-white border border-border rounded-md p-4 text-xs text-muted-foreground space-y-1.5">
                        <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">공고 메타</h3>
                        <p>조회수: <span className="text-foreground font-medium">-회</span></p>
                        {tender.publishedAt && <p>등록일: <span className="text-foreground">{formatDate(tender.publishedAt)}</span></p>}
                        {tender.aiProcessedAt
                            ? <p>AI 분석: <span className="text-violet-600 font-medium">완료</span></p>
                            : <p>AI 분석: <span className="text-orange-500">미완료</span></p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
