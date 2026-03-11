/**
 * 공용 RSS/XML 피드 파서
 * AfDB, ADB, EIB, IADB 등 RSS 피드를 제공하는 MDB 공통 사용
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ParsedTender } from './worldbank'

export interface RSSSourceConfig {
    name: string
    issuer: string
    crawlerType: string
    rssUrl: string
    region: string
    category?: string
}

export const RSS_SOURCES: RSSSourceConfig[] = [
    {
        name: 'AfDB',
        issuer: 'African Development Bank (AfDB)',
        crawlerType: 'AFDB_RSS',
        rssUrl: 'https://www.afdb.org/en/rss/projects-and-operations/procurement',
        region: '아프리카',
        category: '기타인프라',
    },
    {
        name: 'ADB',
        issuer: 'Asian Development Bank (ADB)',
        crawlerType: 'ADB_RSS',
        rssUrl: 'https://www.adb.org/rss/projects.xml',
        region: '아시아',
        category: '기타인프라',
    },
    {
        name: 'EIB',
        issuer: 'European Investment Bank (EIB)',
        crawlerType: 'EIB_RSS',
        rssUrl: 'https://www.eib.org/en/projects/calls/rss.htm',
        region: '유럽',
        category: '기타인프라',
    },
    {
        name: 'IADB',
        issuer: 'Inter-American Development Bank (IADB)',
        crawlerType: 'IADB_RSS',
        rssUrl: 'https://www.iadb.org/en/rss/news',
        region: '중남미',
        category: '기타인프라',
    },
]

export async function fetchRSSTenders(config: RSSSourceConfig, maxRows = 50): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    try {
        const response = await axios.get(config.rssUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BidWatchBot/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
        })

        const $ = cheerio.load(response.data, { xmlMode: true })

        // RSS 2.0 <item> or Atom <entry> 모두 지원
        const items = $('item, entry')

        items.each((i, el) => {
            if (results.length >= maxRows) return false
            const $el = $(el)

            const title = $el.find('title').first().text().trim()
                || $el.children('title').text().trim()
            if (!title || title.length < 5) return

            const link = $el.find('link').first().text().trim()
                || $el.find('link').attr('href')
                || $el.children('link').text().trim()
                || ''

            const description = $el.find('description, summary, content').first().text().trim()
            const pubDate = $el.find('pubDate, published, updated, dc\\:date').first().text().trim()
            const guid = $el.find('guid, id').first().text().trim() || link || `${config.crawlerType}-${i}`

            // 국가 추출 시도
            const country = extractCountry(title + ' ' + description) || config.region

            const publishedAt = pubDate ? new Date(pubDate) : new Date()
            if (isNaN(publishedAt.getTime())) {
                // 날짜 파싱 실패시 오늘
            }

            const cleanDesc = description
                .replace(/<[^>]+>/g, '') // HTML 태그 제거
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 2000)

            results.push({
                externalId: guid,
                title,
                country,
                issuer: config.issuer,
                category: inferCategory(title),
                contractType: inferContractType(title),
                publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                deadlineAt: extractDeadline(cleanDesc) ?? addDays(new Date(), 30),
                originalUrl: link.startsWith('http') ? link : null,
                rawText: `${title}\n\n${cleanDesc}\n\nSource: ${config.issuer}\nURL: ${link}`,
            })
        })
    } catch (err: any) {
        console.error(`[RSS Parser] Error fetching ${config.name} (${config.rssUrl}):`, err.message)
    }

    return results
}

// 제목/설명에서 국가명 추출
function extractCountry(text: string): string | null {
    const countries: [RegExp, string][] = [
        [/\bIndonesia\b/i, '인도네시아'],
        [/\bViet ?Nam\b|\bVietnam\b/i, '베트남'],
        [/\bPhilippines?\b/i, '필리핀'],
        [/\bCambodia\b/i, '캄보디아'],
        [/\bMyanmar\b/i, '미얀마'],
        [/\bThailand\b/i, '태국'],
        [/\bBangladesh\b/i, '방글라데시'],
        [/\bPakistan\b/i, '파키스탄'],
        [/\bIndia\b/i, '인도'],
        [/\bNepal\b/i, '네팔'],
        [/\bSri ?Lanka\b/i, '스리랑카'],
        [/\bKenya\b/i, '케냐'],
        [/\bEthiopia\b/i, '에티오피아'],
        [/\bNigeria\b/i, '나이지리아'],
        [/\bGhana\b/i, '가나'],
        [/\bTanzania\b/i, '탄자니아'],
        [/\bMozambique\b/i, '모잠비크'],
        [/\bZambia\b/i, '잠비아'],
        [/\bSenegal\b/i, '세네갈'],
        [/\bCameroon\b/i, '카메룬'],
        [/\bUganda\b/i, '우간다'],
        [/\bBrazil\b/i, '브라질'],
        [/\bColombia\b/i, '콜롬비아'],
        [/\bPeru\b/i, '페루'],
        [/\bBolivia\b/i, '볼리비아'],
        [/\bMexico\b/i, '멕시코'],
        [/\bIraq\b/i, '이라크'],
        [/\bEgypt\b/i, '이집트'],
        [/\bMorocco\b/i, '모로코'],
        [/\bTunisia\b/i, '튀니지아'],
        [/\bMongolia\b/i, '몽골'],
        [/\bKazakhstan\b/i, '카자흐스탄'],
        [/\bUzbekistan\b/i, '우즈베키스탄'],
    ]
    for (const [re, name] of countries) {
        if (re.test(text)) return name
    }
    return null
}

function inferCategory(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('road') || t.includes('highway') || t.includes('transport')) return '도로/교통'
    if (t.includes('bridge')) return '교량'
    if (t.includes('water') || t.includes('sanit')) return '상하수도'
    if (t.includes('power') || t.includes('energy') || t.includes('electric')) return '에너지'
    if (t.includes('rail') || t.includes('railway') || t.includes('metro')) return '철도'
    if (t.includes('port') || t.includes('harbor')) return '항만'
    if (t.includes('ict') || t.includes('digital') || t.includes('software')) return 'ICT'
    if (t.includes('health') || t.includes('hospital')) return '보건/의료'
    if (t.includes('education') || t.includes('school')) return '교육'
    if (t.includes('building') || t.includes('urban') || t.includes('housing')) return '건축/도시'
    return '기타인프라'
}

function inferContractType(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('rfp') || t.includes('proposal')) return 'RFP'
    if (t.includes('rfq') || t.includes('quotation')) return 'RFQ'
    if (t.includes('eoi') || t.includes('expression of interest')) return 'EOI'
    if (t.includes('prequalif')) return 'PQ'
    return 'ICB'
}

function extractDeadline(text: string): Date | null {
    // "deadline: DD Month YYYY", "closing date: ...", etc.
    const patterns = [
        /deadline[:\s]+(\w+ \d{1,2},?\s+\d{4})/i,
        /closing date[:\s]+(\w+ \d{1,2},?\s+\d{4})/i,
        /due[:\s]+(\w+ \d{1,2},?\s+\d{4})/i,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    ]
    for (const re of patterns) {
        const m = text.match(re)
        if (m) {
            const d = new Date(m[1])
            if (!isNaN(d.getTime()) && d > new Date()) return d
        }
    }
    return null
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}
