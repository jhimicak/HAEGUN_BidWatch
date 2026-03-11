/**
 * 크롤링 메인 모듈
 *
 * crawlerType → 파서 디스패치:
 *   WORLDBANK_API  → World Bank JSON API
 *   ADB_RSS        → ADB RSS 피드
 *   UNGM_SCRAPE    → UNGM 공개 페이지
 *   AFDB_RSS       → AfDB RSS 피드
 *   EIB_RSS        → EIB RSS 피드
 *   IADB_RSS       → IADB RSS 피드
 *   AIIB_SCRAPE    → AIIB 공고 페이지
 *   IFC_API        → IFC (World Bank API 필터)
 *   ISDB_SCRAPE    → IsDB 공고 페이지
 *   CABEI_SCRAPE   → CABEI 공고 페이지
 */
import { prisma } from './prisma'
import crypto from 'crypto'
import { fetchWorldBankTenders } from './parsers/worldbank'
import { fetchUNGMTenders } from './parsers/ungm'
import { fetchRSSTenders, RSS_SOURCES } from './parsers/rss_parser'
import { fetchAIIBTenders } from './parsers/aiib'
import { fetchIsDBTenders, fetchCABEITenders, fetchIFCTenders } from './parsers/other_mdbs'
import type { ParsedTender } from './parsers/worldbank'

function generateHash(sourceId: string, externalId: string): string {
    return crypto
        .createHash('sha256')
        .update(`${sourceId}:${externalId}`)
        .digest('hex')
        .slice(0, 32)
}

async function fetchFromSource(source: {
    id: string
    name: string
    crawlerType: string | null
    url: string
}): Promise<ParsedTender[]> {
    const type = source.crawlerType?.toUpperCase() ?? ''
    console.log(`[Crawler] → ${source.name} (${type})`)

    try {
        // World Bank
        if (type === 'WORLDBANK_API') return await fetchWorldBankTenders(50)

        // UNGM
        if (type === 'UNGM_SCRAPE') return await fetchUNGMTenders(50)

        // AIIB
        if (type === 'AIIB_SCRAPE') return await fetchAIIBTenders(50)

        // IFC
        if (type === 'IFC_API') return await fetchIFCTenders(50)

        // IsDB
        if (type === 'ISDB_SCRAPE') return await fetchIsDBTenders(50)

        // CABEI
        if (type === 'CABEI_SCRAPE') return await fetchCABEITenders(50)

        // RSS 피드 방식 (AfDB, ADB, EIB, IADB 모두)
        const rssConfig = RSS_SOURCES.find((s) => s.crawlerType === type)
        if (rssConfig) return await fetchRSSTenders(rssConfig, 50)

        console.warn(`[Crawler] Unknown crawlerType "${type}" — skipping`)
        return []
    } catch (err: any) {
        console.error(`[Crawler] Parser error for ${source.name}:`, err.message)
        return []
    }
}

export async function runCrawler(sourceId: string | null, logId: string): Promise<void> {
    const startTime = Date.now()
    let totalFetched = 0, newCreated = 0, updated = 0, duplicates = 0, errors = 0
    let errorMessage: string | undefined

    try {
        const sources = sourceId
            ? await prisma.source.findMany({
                where: { id: sourceId, isActive: true },
                select: { id: true, name: true, url: true, crawlerType: true },
            })
            : await prisma.source.findMany({
                where: { isActive: true },
                select: { id: true, name: true, url: true, crawlerType: true },
            })

        if (sources.length === 0) {
            console.warn('[Crawler] No active sources found')
        }

        for (const source of sources) {
            let scraped: ParsedTender[] = []

            try {
                scraped = await fetchFromSource(source)
                totalFetched += scraped.length
                console.log(`[Crawler] ${source.name}: ${scraped.length} items fetched`)
            } catch (err: any) {
                errors++
                errorMessage = err.message
                console.error(`[Crawler] Fetch failed for ${source.name}:`, err.message)
            }

            for (const item of scraped) {
                const hash = generateHash(source.id, item.externalId || item.originalUrl || item.title)

                try {
                    const existing = await prisma.tender.findUnique({ where: { sourceHash: hash } })

                    if (existing) {
                        if (item.deadlineAt && existing.deadlineAt?.getTime() !== item.deadlineAt.getTime()) {
                            await prisma.tender.update({
                                where: { sourceHash: hash },
                                data: { deadlineAt: item.deadlineAt, updatedAt: new Date() },
                            })
                            updated++
                        } else {
                            duplicates++
                        }
                    } else {
                        const tender = await prisma.tender.create({
                            data: {
                                sourceId: source.id,
                                sourceHash: hash,
                                title: item.title,
                                country: item.country,
                                issuer: item.issuer,
                                category: item.category ?? null,
                                contractType: item.contractType ?? null,
                                budget: item.budget ?? null,
                                budgetCurrency: item.budgetCurrency ?? (item.budget ? 'USD' : null),
                                budgetText: item.budgetText ?? null,
                                publishedAt: item.publishedAt ?? new Date(),
                                deadlineAt: item.deadlineAt ?? null,
                                originalUrl: item.originalUrl ?? null,
                                status: 'OPEN',
                                viewCount: 0,
                            },
                        })

                        if (item.rawText) {
                            await prisma.tenderRawContent.create({
                                data: {
                                    tenderId: tender.id,
                                    rawText: item.rawText,
                                    charCount: item.rawText.length,
                                },
                            })
                        }

                        newCreated++
                    }
                } catch (itemErr: any) {
                    errors++
                    console.error('[Crawler] Item save error:', itemErr.message?.slice(0, 120))
                }
            }

            await prisma.source.update({
                where: { id: source.id },
                data: { lastCrawledAt: new Date() },
            })
        }
    } catch (err: any) {
        errorMessage = err.message
        errors++
        console.error('[Crawler] Fatal error:', err)
    }

    const duration = Date.now() - startTime
    const status = errors > 0 && newCreated === 0 && updated === 0 ? 'FAILED'
        : errors > 0 ? 'PARTIAL'
            : 'SUCCESS'

    await prisma.crawlLog.update({
        where: { id: logId },
        data: {
            status,
            finishedAt: new Date(),
            durationMs: duration,
            totalFetched,
            newCreated,
            updated,
            duplicates,
            errors,
            errorMessage: errorMessage?.slice(0, 500),
        },
    })

    console.log(`[Crawler] Done in ${(duration / 1000).toFixed(1)}s — +${newCreated} new, ${updated} updated, ${duplicates} dupes, ${errors} errors`)
}
