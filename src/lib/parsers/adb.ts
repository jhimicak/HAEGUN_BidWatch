/**
 * ADB (Asian Development Bank) 공고 스크래퍼
 * URL: https://www.adb.org/projects/tenders/active
 * Cheerio HTML 파싱 방식
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ParsedTender } from './worldbank'

export async function fetchADBTenders(maxRows: number = 50): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    const pages = [
        { url: 'https://www.adb.org/projects/tenders/active', label: 'Active Tenders' },
        { url: 'https://www.adb.org/site/business-opportunities/operational-procurement/goods-services-consultants/tenders', label: 'Goods & Services' },
    ]

    for (const { url } of pages) {
        try {
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            })

            const $ = cheerio.load(response.data)
            const rows = $('.views-row, .procurement-notice-row, table.views-table tbody tr, .tender-row')

            if (rows.length === 0) {
                console.log(`[ADB Parser] No rows found at ${url}, trying alternative selectors`)
                // 대안 선택자
                $('table tr').each((i, row) => {
                    if (i === 0) return // 헤더 스킵
                    const cells = $(row).find('td')
                    if (cells.length < 3) return

                    const title = cells.eq(0).find('a').text().trim() || cells.eq(0).text().trim()
                    const href = cells.eq(0).find('a').attr('href') || ''
                    const country = cells.eq(1).text().trim()
                    const deadline = cells.eq(cells.length - 1).text().trim()

                    if (!title || title.length < 5) return

                    const id = href.split('/').filter(Boolean).pop() || `adb-${i}-${Date.now()}`
                    const publishedAt = new Date()

                    results.push({
                        externalId: `adb-${id}`,
                        title,
                        country: country || '아시아',
                        issuer: 'Asian Development Bank (ADB)',
                        category: inferCategory(title),
                        contractType: 'ICB',
                        publishedAt,
                        deadlineAt: parseDeadlineDate(deadline) ?? addDays(publishedAt, 30),
                        originalUrl: href.startsWith('http') ? href : `https://www.adb.org${href}`,
                        rawText: `${title}\nIssuer: ADB\nCountry: ${country}\nDeadline: ${deadline}`,
                    })

                    if (results.length >= maxRows) return false
                })
            } else {
                rows.each((i, row) => {
                    const $row = $(row)
                    const titleEl = $row.find('.views-field-title a, .field-content a, h3 a, h4 a, a.tender-title').first()
                    const title = titleEl.text().trim() || $row.find('.views-field-title, .field-title').text().trim()
                    const href = titleEl.attr('href') || ''
                    const country = $row.find('.views-field-field-country, .country').text().trim()
                    const deadline = $row.find('.views-field-field-deadline, .deadline, .closing-date').text().trim()

                    if (!title || title.length < 5) return

                    const id = href.split('/').filter(Boolean).pop() || `adb-${i}-${Date.now()}`
                    const publishedAt = new Date()

                    results.push({
                        externalId: `adb-${id}`,
                        title,
                        country: country || '아시아',
                        issuer: 'Asian Development Bank (ADB)',
                        category: inferCategory(title),
                        contractType: 'ICB',
                        publishedAt,
                        deadlineAt: parseDeadlineDate(deadline) ?? addDays(publishedAt, 30),
                        originalUrl: href.startsWith('http') ? href : `https://www.adb.org${href}`,
                        rawText: `${title}\nIssuer: ADB\nCountry: ${country}\nDeadline: ${deadline}`,
                    })

                    if (results.length >= maxRows) return false
                })
            }

            if (results.length > 0) break
        } catch (err: any) {
            console.error(`[ADB Parser] Error fetching ${url}:`, err.message)
        }
    }

    return results
}

function parseDeadlineDate(str: string): Date | null {
    if (!str) return null
    const cleaned = str.replace(/[^\d\-\/\s,a-zA-Z]/g, '').trim()
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
    if (t.includes('road') || t.includes('highway') || t.includes('transport')) return '도로/교통'
    if (t.includes('bridge')) return '교량'
    if (t.includes('water') || t.includes('sewage') || t.includes('sanit')) return '상하수도'
    if (t.includes('power') || t.includes('energy') || t.includes('electric')) return '에너지'
    if (t.includes('rail') || t.includes('railway') || t.includes('metro')) return '철도'
    if (t.includes('port') || t.includes('harbor')) return '항만'
    if (t.includes('ict') || t.includes('digital') || t.includes('software')) return 'ICT'
    if (t.includes('building') || t.includes('urban') || t.includes('housing')) return '건축/도시'
    if (t.includes('airport') || t.includes('aviation')) return '항공'
    return '기타인프라'
}
