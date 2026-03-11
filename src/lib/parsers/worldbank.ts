/**
 * World Bank 공개 API 파서
 * API: https://search.worldbank.org/api/v2/wds
 * 인증: 불필요
 */
import axios from 'axios'

export interface ParsedTender {
    externalId: string
    title: string
    country: string
    issuer: string
    category?: string
    contractType?: string
    budget?: number
    budgetCurrency?: string
    budgetText?: string
    publishedAt?: Date
    deadlineAt?: Date
    originalUrl?: string
    rawText?: string
}

const API_BASE = 'https://search.worldbank.org/api/v2/wds'

export async function fetchWorldBankTenders(maxRows: number = 50): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    try {
        const response = await axios.get(API_BASE, {
            params: {
                format: 'json',
                fct: 'colti_s:Procurement',
                rows: maxRows,
                os: 0,
                srt: 'score',
                order: 'desc',
                strdate: getDateMonthsAgo(3),
                fl: 'id,display_title,geo_reg,majtheme,url,docty,repnme,dispdocdt',
            },
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BidWatchBot/1.0)' },
        })

        const docs: any[] = response.data?.documents
            ? Object.values(response.data.documents)
            : []

        for (const doc of docs) {
            if (!doc.display_title) continue

            const id = doc.id || doc.repnme || String(Math.random())
            const publishedAt = doc.dispdocdt ? parseDate(doc.dispdocdt) : new Date()

            results.push({
                externalId: String(id),
                title: doc.display_title,
                country: mapRegionToCountry(doc.geo_reg) || '미상',
                issuer: 'World Bank',
                category: mapSectorToCategory(doc.majtheme),
                contractType: doc.docty || 'Procurement',
                publishedAt,
                deadlineAt: addDays(publishedAt, 45), // 마감일이 없으면 기본 45일 후
                originalUrl: doc.url || `https://projects.worldbank.org/en/projects-operations/procurement`,
                rawText: `${doc.display_title}\nIssuer: World Bank\nCountry: ${doc.geo_reg}\nSector: ${doc.majtheme}\nPublished: ${doc.dispdocdt}`,
            })
        }
    } catch (err: any) {
        console.error('[WorldBank Parser] Error:', err.message)
        // API가 실패하면 두 번째 엔드포인트 시도
        try {
            return await fetchWorldBankProjectsTenders(maxRows)
        } catch {
            console.error('[WorldBank Parser] Fallback also failed')
        }
    }

    return results
}

async function fetchWorldBankProjectsTenders(maxRows: number): Promise<ParsedTender[]> {
    const results: ParsedTender[] = []

    const response = await axios.get('https://search.worldbank.org/api/v2/projects', {
        params: {
            format: 'json',
            status: 'Active',
            rows: maxRows,
            fl: 'id,project_name,countryname,sector1,url,projectfinancialtype,boardapprovaldate',
        },
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BidWatchBot/1.0)' },
    })

    const projects: any[] = response.data?.projects
        ? Object.values(response.data.projects)
        : []

    for (const proj of projects) {
        if (!proj.project_name) continue
        const publishedAt = proj.boardapprovaldate ? parseDate(proj.boardapprovaldate) : new Date()

        results.push({
            externalId: `wb-proj-${proj.id}`,
            title: proj.project_name,
            country: proj.countryname || '미상',
            issuer: 'World Bank',
            category: mapSectorToCategory(proj.sector1),
            contractType: proj.projectfinancialtype,
            publishedAt,
            deadlineAt: addDays(publishedAt, 60),
            originalUrl: proj.url || `https://projects.worldbank.org/en/projects-operations/project-detail/${proj.id}`,
            rawText: `${proj.project_name}\nIssuer: World Bank\nCountry: ${proj.countryname}\nSector: ${proj.sector1}`,
        })
    }

    return results
}

function parseDate(str: string): Date {
    const d = new Date(str)
    return isNaN(d.getTime()) ? new Date() : d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function getDateMonthsAgo(months: number): string {
    const d = new Date()
    d.setMonth(d.getMonth() - months)
    return d.toISOString().slice(0, 10)
}

function mapRegionToCountry(region: string): string {
    if (!region) return '미상'
    const map: Record<string, string> = {
        'East Asia and Pacific': '동아시아/태평양',
        'South Asia': '남아시아',
        'Sub-Saharan Africa': '아프리카',
        'Latin America & Caribbean': '중남미',
        'Europe and Central Asia': '유럽/중앙아시아',
        'Middle East and North Africa': '중동/북아프리카',
    }
    return map[region] || region
}

function mapSectorToCategory(sector: string): string {
    if (!sector) return '기타'
    const s = sector.toLowerCase()
    if (s.includes('transport') || s.includes('road') || s.includes('highway')) return '도로/교통'
    if (s.includes('water') || s.includes('sanit')) return '상하수도'
    if (s.includes('energy') || s.includes('power')) return '에너지'
    if (s.includes('health')) return '보건'
    if (s.includes('education')) return '교육'
    if (s.includes('urban') || s.includes('housing')) return '도시개발'
    if (s.includes('agriculture') || s.includes('rural')) return '농업/농촌'
    if (s.includes('digital') || s.includes('ict') || s.includes('tech')) return 'ICT'
    return '기타'
}
