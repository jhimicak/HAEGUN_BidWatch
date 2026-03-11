/**
 * UNGM (UN Global Marketplace) 공개 공고 스크래퍼
 * URL: https://www.ungm.org/Public/Notice
 * 공개 목록 페이지 Cheerio 파싱
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ParsedTender } from './worldbank'

export async function fetchUNGMTenders(maxRows: number = 50): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    try {
        const response = await axios.get('https://www.ungm.org/Public/Notice', {
            params: { noticeType: 0 }, // 0 = RFP, 1 = ITB
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        })

        const $ = cheerio.load(response.data)

        // UNGM 목록 테이블 파싱
        $('table.tablesorter tbody tr, .notice-list tr, table tbody tr').each((i, row) => {
            if (results.length >= maxRows) return false
            const $row = $(row)
            const cells = $row.find('td')
            if (cells.length < 3) return

            const titleEl = cells.eq(0).find('a').first()
            const title = titleEl.text().trim() || cells.eq(0).text().trim()
            const href = titleEl.attr('href') || ''

            if (!title || title.length < 5) return

            // 각 열에서 정보 추출
            const ref = cells.eq(1).text().trim()
            const organization = cells.eq(2).text().trim()
            const country = cells.eq(3).text().trim()
            const deadline = cells.eq(cells.length - 1).text().trim()

            const id = ref || href.split('/').pop() || `ungm-${i}-${Date.now()}`
            const publishedAt = new Date()
            const deadlineAt = parseDateString(deadline) ?? addDays(publishedAt, 30)

            results.push({
                externalId: `ungm-${id}`,
                title,
                country: country || '국제기구',
                issuer: organization || 'United Nations',
                category: inferCategory(title),
                contractType: 'RFP',
                publishedAt,
                deadlineAt,
                originalUrl: href.startsWith('http') ? href : `https://www.ungm.org${href}`,
                rawText: `${title}\nRef: ${ref}\nIssuer: ${organization}\nCountry: ${country}\nDeadline: ${deadline}`,
            })
        })

        // 결과가 없으면 전체 페이지 내용 기반으로 재시도
        if (results.length === 0) {
            console.log('[UNGM Parser] Table parse failed. Trying generic link extraction...')
            $('a[href*="/Public/Notice/"]').each((i, el) => {
                if (results.length >= maxRows) return false
                const href = $(el).attr('href') || ''
                const title = $(el).text().trim()
                if (!title || title.length < 5) return
                const id = href.split('/').pop() || `ungm-${i}`

                results.push({
                    externalId: `ungm-${id}`,
                    title,
                    country: '국제기구',
                    issuer: 'United Nations',
                    category: inferCategory(title),
                    contractType: 'RFP',
                    publishedAt: new Date(),
                    deadlineAt: addDays(new Date(), 30),
                    originalUrl: `https://www.ungm.org${href}`,
                    rawText: title,
                })
            })
        }
    } catch (err: any) {
        console.error('[UNGM Parser] Error:', err.message)
    }

    return results
}

function parseDateString(str: string): Date | null {
    if (!str) return null
    // "DD-MMM-YYYY", "DD/MM/YYYY", "Month DD, YYYY" 등 형식 처리
    const cleaned = str.replace(/[^0-9a-zA-Z\-\/\s,]/g, '').trim()
    const d = new Date(cleaned)
    return isNaN(d.getTime()) ? null : d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function inferCategory(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('construction') || t.includes('infrastructure') || t.includes('civil')) return '토목/건설'
    if (t.includes('road') || t.includes('highway') || t.includes('transport')) return '도로/교통'
    if (t.includes('water') || t.includes('sanit')) return '상하수도'
    if (t.includes('health') || t.includes('medical') || t.includes('hospital')) return '보건/의료'
    if (t.includes('it ') || t.includes('ict') || t.includes('software') || t.includes('digital')) return 'ICT'
    if (t.includes('food') || t.includes('agriculture')) return '농업/식량'
    if (t.includes('energy') || t.includes('solar') || t.includes('power')) return '에너지'
    if (t.includes('education') || t.includes('training')) return '교육'
    if (t.includes('vehicle') || t.includes('truck') || t.includes('equipment')) return '장비/물자'
    return '기타'
}
