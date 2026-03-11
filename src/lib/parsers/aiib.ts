/**
 * AIIB (Asian Infrastructure Investment Bank) 스크래퍼
 * URL: https://www.aiib.org/en/opportunities/business/project-procurement/list.html
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ParsedTender } from './worldbank'
import { fetchRSSTenders } from './rss_parser'

export async function fetchAIIBTenders(maxRows = 50): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    const urls = [
        'https://www.aiib.org/en/opportunities/business/project-procurement/list.html',
        'https://www.aiib.org/en/opportunities/business/consulting/list.html',
    ]

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html',
                },
            })

            const $ = cheerio.load(response.data)

            // AIIB 공고 목록 파싱
            $('.list-content li, .procurement-list li, .content-list li, table tbody tr').each((i, el) => {
                if (results.length >= maxRows) return false
                const $el = $(el)

                const titleEl = $el.find('a').first()
                const title = titleEl.text().trim() || $el.text().trim().slice(0, 200)
                const href = titleEl.attr('href') || ''
                if (!title || title.length < 5) return

                const cells = $el.find('td')
                const country = cells.eq(1).text().trim() || extractCountryFromText(title)
                const deadline = cells.last().text().trim()

                const id = href.split('/').filter(Boolean).pop() || `aiib-${i}-${Date.now()}`
                const publishedAt = new Date()

                results.push({
                    externalId: `aiib-${id}`,
                    title,
                    country: country || '아시아',
                    issuer: 'Asian Infrastructure Investment Bank (AIIB)',
                    category: inferCategory(title),
                    contractType: 'ICB',
                    publishedAt,
                    deadlineAt: parseDate(deadline) ?? addDays(publishedAt, 45),
                    originalUrl: href.startsWith('http') ? href : href ? `https://www.aiib.org${href}` : null,
                    rawText: `${title}\nIssuer: AIIB\nCountry: ${country}\nDeadline: ${deadline}`,
                })
            })

            if (results.length > 0) break
        } catch (err: any) {
            console.error('[AIIB Parser] Error:', err.message)
        }
    }

    return results
}

function extractCountryFromText(text: string): string {
    const map: [RegExp, string][] = [
        [/\bIndia\b/i, '인도'], [/\bChina\b/i, '중국'], [/\bIndonesia\b/i, '인도네시아'],
        [/\bPakistan\b/i, '파키스탄'], [/\bBangladesh\b/i, '방글라데시'], [/\bPhilippines?\b/i, '필리핀'],
        [/\bTurkey|Türkiye\b/i, '터키'], [/\bAzerbaijan\b/i, '아제르바이잔'], [/\bMongolia\b/i, '몽골'],
        [/\bKazakhstan\b/i, '카자흐스탄'], [/\bUzbekistan\b/i, '우즈베키스탄'], [/\bOman\b/i, '오만'],
        [/\bEgypt\b/i, '이집트'], [/\bEthiopia\b/i, '에티오피아'], [/\bMyanmar\b/i, '미얀마'],
    ]
    for (const [re, name] of map) if (re.test(text)) return name
    return '아시아'
}

function inferCategory(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('road') || t.includes('highway') || t.includes('transport')) return '도로/교통'
    if (t.includes('bridge')) return '교량'
    if (t.includes('water') || t.includes('sanit')) return '상하수도'
    if (t.includes('power') || t.includes('energy')) return '에너지'
    if (t.includes('rail') || t.includes('metro')) return '철도'
    if (t.includes('port')) return '항만'
    if (t.includes('ict') || t.includes('digital')) return 'ICT'
    return '기타인프라'
}

function parseDate(str: string): Date | null {
    if (!str) return null
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}
