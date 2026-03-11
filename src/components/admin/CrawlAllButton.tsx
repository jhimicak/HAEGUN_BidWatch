'use client'

import { useState } from 'react'
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export function CrawlAllButton() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle')

    const handleCrawlAll = async () => {
        if (!confirm('전체 소스에 대해 크롤링을 시작하겠습니까?\n(시간이 다소 소요될 수 있습니다)')) return
        setLoading(true)
        setResult('idle')
        try {
            const res = await fetch('/api/admin/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),   // sourceId 없음 → 전체 실행
            })
            setResult(res.ok ? 'success' : 'error')
            setTimeout(() => setResult('idle'), 5000)
        } catch {
            setResult('error')
            setTimeout(() => setResult('idle'), 5000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleCrawlAll}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${result === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                    result === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
                        'bg-primary text-primary-foreground hover:bg-primary/90'}
        disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 전체 수집 중...</>
            ) : result === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /> 수집 시작됨!</>
            ) : result === 'error' ? (
                <><XCircle className="w-4 h-4" /> 오류 발생</>
            ) : (
                <><Play className="w-4 h-4" /> 전체 수동 실행</>
            )}
        </button>
    )
}
