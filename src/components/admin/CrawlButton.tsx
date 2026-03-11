'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface CrawlButtonProps {
    sourceId: string
    sourceName: string
}

export function CrawlButton({ sourceId, sourceName }: CrawlButtonProps) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle')

    const handleCrawl = async () => {
        setLoading(true)
        setResult('idle')
        try {
            const res = await fetch('/api/admin/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId }),
            })
            if (res.ok) {
                setResult('success')
                setTimeout(() => setResult('idle'), 3000)
            } else {
                setResult('error')
                setTimeout(() => setResult('idle'), 3000)
            }
        } catch {
            setResult('error')
            setTimeout(() => setResult('idle'), 3000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleCrawl}
            disabled={loading}
            className={`text-xs px-2.5 py-1 border rounded transition-colors flex items-center gap-1
        ${result === 'success' ? 'border-green-300 bg-green-50 text-green-700' :
                    result === 'error' ? 'border-red-300 bg-red-50 text-red-700' :
                        'border-border hover:bg-muted text-foreground'}
        disabled:opacity-60 disabled:cursor-not-allowed`}
            title={`${sourceName} 수동 수집`}
        >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '수집 중...' : result === 'success' ? '완료!' : result === 'error' ? '오류' : '수동 실행'}
        </button>
    )
}
