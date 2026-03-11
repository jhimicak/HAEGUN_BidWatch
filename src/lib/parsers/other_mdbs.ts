/**
 * IsDB (Islamic Development Bank) + CABEI + IFC 스크래퍼
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ParsedTender } from './worldbank'

async function scrapeGenericMDB(opts: {
    url: string
    issuer: string
    idPrefix: string
    defaultCountry: string
    defaultRegion: string
}): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    try {
        const response = await axios.get(opts.url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
        })

        const $ = cheerio.load(response.data)

        // 일반적인 MDB 페이지 구조 - 여러 선택자 시도
        const selectors = [
            'table tbody tr',
            '.procurement-list li',
            '.tender-list li',
            '.opportunity-list .item',
            '.news-list .item',
            'article',
        ]

        for (const sel of selectors) {
            const items = $(sel)
            if (items.length === 0) continue

            items.each((i, el) => {
                if (results.length >= 50) return false
                const $el = $(el)
                const titleEl = $el.find('h2 a, h3 a, td:first-child a, .title a, a.title').first()
                const title = titleEl.text().trim() || $el.find('h2, h3').first().text().trim()
                if (!title || title.length < 8) return

                const href = titleEl.attr('href') || ''
                const cells = $el.find('td')
                const country = cells.eq(1).text().trim() || opts.defaultCountry
                const dateTxt = cells.last().text().trim() || ''
                const published = new Date()

                results.push({
                    externalId: `${opts.idPrefix}-${i}-${Date.now()}`,
                    title,
                    country: country || opts.defaultCountry,
                    issuer: opts.issuer,
                    category: inferCategory(title),
                    contractType: 'ICB',
                    publishedAt: published,
                    deadlineAt: addDays(published, 45),
                    originalUrl: href.startsWith('http') ? href : href ? `${new URL(opts.url).origin}${href}` : null,
                    rawText: `${title}\nIssuer: ${opts.issuer}\nCountry: ${country}\nDate: ${dateTxt}`,
                })
            })

            if (results.length > 0) break
        }
    } catch (err: any) {
        console.error(`[Generic MDB] Error fetching ${opts.issuer}:`, err.message)
    }

    return results
}

export async function fetchIsDBTenders(maxRows = 50): Promise<ParsedTender[]> {
    return scrapeGenericMDB({
        url: 'https://www.isdb.org/project-procurement/procurement-notices',
        issuer: 'Islamic Development Bank (IsDB)',
        idPrefix: 'isdb',
        defaultCountry: '중동/이슬람권',
        defaultRegion: '중동/이슬람권',
    })
}

export async function fetchCABEITenders(maxRows = 50): Promise<ParsedTender[]> {
    return scrapeGenericMDB({
        url: 'https://www.bcie.org/proyectos-y-actividades/adquisiciones/',
        issuer: 'Central American Bank for Economic Integration (CABEI)',
        idPrefix: 'cabei',
        defaultCountry: '중앙아메리카',
        defaultRegion: '중남미',
    })
}

export async function fetchIFCTenders(maxRows = 50): Promise<ParsedTender[]> {
    // IFC는 World Bank 그룹 → WB API에 IFC 태그 필터
    const results: ParsedTender[] = []
    try {
        const response = await axios.get('https://search.worldbank.org/api/v2/wds', {
            params: {
                format: 'json',
                fct: 'colti_s:IFC',
                rows: maxRows,
                srt: 'score',
                order: 'desc',
                fl: 'id,display_title,geo_reg,majtheme,url,docty,dispdocdt',
            },
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BidWatchBot/1.0)' },
        })

        const docs: any[] = response.data?.documents ? Object.values(response.data.documents) : []
        for (const doc of docs.slice(0, maxRows)) {
            if (!doc.display_title) continue
            const published = doc.dispdocdt ? new Date(doc.dispdocdt) : new Date()
            results.push({
                externalId: `ifc-${doc.id}`,
                title: doc.display_title,
                country: doc.geo_reg || '국제',
                issuer: 'IFC (International Finance Corporation)',
                category: inferCategory(doc.display_title),
                contractType: 'RFP',
                publishedAt: isNaN(published.getTime()) ? new Date() : published,
                deadlineAt: addDays(published, 45),
                originalUrl: doc.url || null,
                rawText: `${doc.display_title}\nIssuer: IFC\nCountry: ${doc.geo_reg}\nSector: ${doc.majtheme}`,
            })
        }
    } catch (err: any) {
        console.error('[IFC Parser] Error:', err.message)
    }
    return results
}

function inferCategory(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('road') || t.includes('highway') || t.includes('transport')) return '도로/교통'
    if (t.includes('water') || t.includes('sanit')) return '상하수도'
    if (t.includes('power') || t.includes('energy')) return '에너지'
    if (t.includes('rail') || t.includes('metro')) return '철도'
    if (t.includes('health') || t.includes('medical')) return '보건/의료'
    if (t.includes('ict') || t.includes('digital')) return 'ICT'
    if (t.includes('finance') || t.includes('bank')) return '금융'
    return '기타인프라'
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}
