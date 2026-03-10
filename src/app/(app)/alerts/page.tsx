'use client'
import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Globe, Tag, DollarSign, Clock } from 'lucide-react'

interface AlertRule {
    id: string
    name: string
    isActive: boolean
    emailEnabled: boolean
    countries: string[]
    categories: string[]
    keywords: string[]
    minBudget: number | null
    deadlineInDays: number | null
    notifyOnNew: boolean
    notifyBeforeDays: number | null
    triggerCount: number
    lastTriggeredAt: string | null
    createdAt: string
}

const COUNTRIES = ['인도네시아', '베트남', '필리핀', '캄보디아', '방글라데시', '파키스탄', '케냐', '에티오피아', '나이지리아', '미얀마', '태국', '인도']
const CATEGORIES = ['도로', '교량', '상하수도', '건축', '철도', '항만', '에너지', 'ICT', '토목']

export default function AlertsPage() {
    const [rules, setRules] = useState<AlertRule[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        name: '',
        countries: [] as string[],
        categories: [] as string[],
        keywords: '',
        minBudget: '',
        deadlineInDays: '',
        emailEnabled: true,
        notifyOnNew: true,
        notifyBeforeDays: '',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchRules() }, [])

    async function fetchRules() {
        setLoading(true)
        try {
            const res = await fetch('/api/alert-rules')
            const data = await res.json()
            setRules(data)
        } finally {
            setLoading(false)
        }
    }

    async function saveRule(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await fetch('/api/alert-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    countries: form.countries,
                    categories: form.categories,
                    keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
                    minBudget: form.minBudget ? parseFloat(form.minBudget) : null,
                    deadlineInDays: form.deadlineInDays ? parseInt(form.deadlineInDays) : null,
                    emailEnabled: form.emailEnabled,
                    notifyOnNew: form.notifyOnNew,
                    notifyBeforeDays: form.notifyBeforeDays ? parseInt(form.notifyBeforeDays) : null,
                }),
            })
            setShowForm(false)
            setForm({ name: '', countries: [], categories: [], keywords: '', minBudget: '', deadlineInDays: '', emailEnabled: true, notifyOnNew: true, notifyBeforeDays: '' })
            fetchRules()
        } finally {
            setSaving(false)
        }
    }

    async function toggleRule(id: string, isActive: boolean) {
        await fetch(`/api/alert-rules/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !isActive }),
        })
        fetchRules()
    }

    async function deleteRule(id: string) {
        if (!confirm('이 알림 규칙을 삭제하시겠습니까?')) return
        await fetch(`/api/alert-rules/${id}`, { method: 'DELETE' })
        fetchRules()
    }

    function toggleMulti<T>(arr: T[], val: T): T[] {
        return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
    }

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">알림 규칙</h1>
                    <p className="page-subtitle">조건에 맞는 신규 공고를 이메일로 알려드립니다</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    새 규칙 추가
                </button>
            </div>

            <div className="p-6 space-y-4">
                {/* New rule form */}
                {showForm && (
                    <div className="bg-white border border-primary/30 rounded-md overflow-hidden">
                        <div className="px-5 py-3 bg-blue-50 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">새 알림 규칙 만들기</h2>
                        </div>
                        <form onSubmit={saveRule} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">규칙 이름 *</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="예: 동남아 도로 사업 알림"
                                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-2">국가 (복수 선택)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {COUNTRIES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setForm({ ...form, countries: toggleMulti(form.countries, c) })}
                                            className={`text-xs px-2.5 py-1 rounded border transition-colors ${form.countries.includes(c) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-2">공종 (복수 선택)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIES.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setForm({ ...form, categories: toggleMulti(form.categories, c) })}
                                            className={`text-xs px-2.5 py-1 rounded border transition-colors ${form.categories.includes(c) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">키워드 (쉼표 구분)</label>
                                    <input
                                        value={form.keywords}
                                        onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                                        placeholder="예: highway, bridge"
                                        className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">최소 예산 (USD)</label>
                                    <input
                                        type="number"
                                        value={form.minBudget}
                                        onChange={(e) => setForm({ ...form, minBudget: e.target.value })}
                                        placeholder="예: 10000000"
                                        className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">마감 임박 (일수 이내)</label>
                                    <input
                                        type="number"
                                        value={form.deadlineInDays}
                                        onChange={(e) => setForm({ ...form, deadlineInDays: e.target.value })}
                                        placeholder="예: 14"
                                        className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.emailEnabled} onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })} className="w-4 h-4 rounded border-border" />
                                    <span className="text-sm text-foreground">이메일 알림 활성화</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.notifyOnNew} onChange={(e) => setForm({ ...form, notifyOnNew: e.target.checked })} className="w-4 h-4 rounded border-border" />
                                    <span className="text-sm text-foreground">신규 공고 즉시 알림</span>
                                </label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                    {saving ? '저장 중...' : '규칙 저장'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors">
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Rules list */}
                {loading ? (
                    <div className="bg-white border border-border rounded-md py-12 text-center text-sm text-muted-foreground">불러오는 중...</div>
                ) : rules.length === 0 ? (
                    <div className="bg-white border border-border rounded-md py-16 flex flex-col items-center text-muted-foreground">
                        <Bell className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm font-medium">설정된 알림 규칙이 없습니다.</p>
                        <p className="text-xs mt-1">상단의 '새 규칙 추가'를 클릭하여 조건을 설정하세요.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rules.map((rule) => (
                            <div key={rule.id} className={`bg-white border rounded-md p-5 ${rule.isActive ? 'border-border' : 'border-border opacity-60'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                                            {rule.emailEnabled && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">이메일</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                            {rule.countries.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {rule.countries.join(', ')}
                                                </span>
                                            )}
                                            {rule.categories.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    {rule.categories.join(', ')}
                                                </span>
                                            )}
                                            {rule.keywords.length > 0 && (
                                                <span>키워드: {rule.keywords.join(', ')}</span>
                                            )}
                                            {rule.minBudget && (
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    USD {Number(rule.minBudget).toLocaleString()}+
                                                </span>
                                            )}
                                            {rule.deadlineInDays && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    마감 {rule.deadlineInDays}일 이내
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-2">
                                            발송 횟수: {rule.triggerCount}회
                                            {rule.lastTriggeredAt && ` · 최근 발송: ${new Date(rule.lastTriggeredAt).toLocaleDateString('ko-KR')}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => toggleRule(rule.id, rule.isActive)}
                                            className="p-1.5 rounded hover:bg-muted transition-colors"
                                            title={rule.isActive ? '비활성화' : '활성화'}
                                        >
                                            {rule.isActive
                                                ? <ToggleRight className="w-5 h-5 text-green-600" />
                                                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
