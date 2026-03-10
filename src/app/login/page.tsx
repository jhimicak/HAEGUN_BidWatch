'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        setLoading(false)

        if (result?.error) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-sm">
                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-foreground">해건 비드워치</h1>
                    <p className="text-sm text-muted-foreground mt-1">HAEGUN BidWatch</p>
                </div>

                {/* Form */}
                <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground mb-5">로그인</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@haegun.or.kr"
                                required
                                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-red-50 border border-red-100 rounded-md px-3 py-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>

                {/* Demo credentials */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700">
                    <p className="font-semibold mb-1">데모 계정</p>
                    <p>관리자: admin@haegun.or.kr / admin1234!</p>
                    <p>사용자: jungho@haegun.or.kr / user1234!</p>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    © 2024 해외건설협회 비드워치
                </p>
            </div>
        </div>
    )
}
