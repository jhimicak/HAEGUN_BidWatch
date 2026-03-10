import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
    title: '해건 비드워치 | HAEGUN BidWatch',
    description: '해외건설협회 입찰공고 수집·분석·알림 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
