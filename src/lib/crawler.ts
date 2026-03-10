/**
 * 크롤링 모듈
 * sources 테이블의 설정값을 읽어 사이트별 목록/상세 수집
 * 중복 공고는 source_hash 기준으로 병합 또는 업데이트
 */
import { prisma } from './prisma'
import crypto from 'crypto'

function generateHash(sourceId: string, externalId: string): string {
    return crypto
        .createHash('sha256')
        .update(`${sourceId}:${externalId}`)
        .digest('hex')
        .slice(0, 32)
}

interface ScrapedTender {
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
    externalId?: string
}

/**
 * 더미 크롤러 - 실제 사이트 대신 샘플 데이터 생성
 * 실제 구현 시 cheerio 또는 playwright를 사용하여 각 소스별 파서 구현
 */
async function dummyCrawlSource(sourceId: string, sourceName: string): Promise<ScrapedTender[]> {
    console.log(`[Crawler] Crawling source: ${sourceName}`)

    // 실제 환경에서는 각 소스 URL에 맞는 파서로 교체
    // 예: World Bank => parse https://projects.worldbank.org/en/projects-operations/procurement
    // 예: UNGM => parse https://www.ungm.org/Public/Notice

    const mockTenders: ScrapedTender[] = [
        {
            externalId: `mock-${Date.now()}-1`,
            title: `[AUTO] Sample Tender from ${sourceName}`,
            country: '인도네시아',
            issuer: sourceName,
            category: '도로',
            contractType: 'ICB',
            budget: 50000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 50,000,000',
            publishedAt: new Date(),
            deadlineAt: new Date(Date.now() + 30 * 86400000),
            originalUrl: `https://example.com/tender/${Date.now()}`,
            rawText: `Sample tender document from ${sourceName}. This is a mock crawl result.\nProject: Sample Infrastructure Project\nCountry: Indonesia\nIssuer: ${sourceName}\nBudget: USD 50 Million\nDeadline: ${new Date(Date.now() + 30 * 86400000).toISOString()}`,
        },
    ]

    return mockTenders
}

/**
 * 실제 크롤러 구조 (Cheerio 기반 예시)
 * 각 소스의 selectors JSON 설정을 기반으로 동작
 */
// async function crawlWithCheerio(source: any): Promise<ScrapedTender[]> {
//   const cheerio = await import('cheerio')
//   const axios = await import('axios')
//   const response = await axios.default.get(source.listUrlPattern, { headers: source.headers || {} })
//   const $ = cheerio.load(response.data)
//   const selectors = source.selectors as any
//   const results: ScrapedTender[] = []
//   $(selectors.item).each((_, el) => {
//     results.push({
//       title: $(el).find(selectors.title).text().trim(),
//       ...
//     })
//   })
//   return results
// }

export async function runCrawler(sourceId: string | null, logId: string): Promise<void> {
    const startTime = Date.now()
    let totalFetched = 0
    let newCreated = 0
    let updated = 0
    let duplicates = 0
    let errors = 0
    let errorMessage: string | undefined

    try {
        // Get sources to crawl
        const sources = sourceId
            ? await prisma.source.findMany({ where: { id: sourceId, isActive: true } })
            : await prisma.source.findMany({ where: { isActive: true } })

        for (const source of sources) {
            try {
                const scraped = await dummyCrawlSource(source.id, source.name)
                totalFetched += scraped.length

                for (const item of scraped) {
                    const hash = generateHash(source.id, item.externalId || item.originalUrl || item.title)

                    try {
                        const existing = await prisma.tender.findUnique({ where: { sourceHash: hash } })
                        if (existing) {
                            // Update if changed
                            await prisma.tender.update({
                                where: { sourceHash: hash },
                                data: {
                                    deadlineAt: item.deadlineAt,
                                    updatedAt: new Date(),
                                },
                            })
                            duplicates++
                        } else {
                            // Create new tender
                            const tender = await prisma.tender.create({
                                data: {
                                    sourceId: source.id,
                                    sourceHash: hash,
                                    title: item.title,
                                    country: item.country,
                                    issuer: item.issuer,
                                    category: item.category,
                                    contractType: item.contractType,
                                    budget: item.budget,
                                    budgetCurrency: item.budgetCurrency,
                                    budgetText: item.budgetText,
                                    publishedAt: item.publishedAt,
                                    deadlineAt: item.deadlineAt,
                                    originalUrl: item.originalUrl,
                                    status: 'OPEN',
                                },
                            })

                            // Store raw content
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
                        console.error('[Crawler] Error processing item:', itemErr.message)
                    }
                }
            } catch (sourceErr: any) {
                errors++
                errorMessage = sourceErr.message
                console.error(`[Crawler] Error crawling source ${source.name}:`, sourceErr.message)
            }

            // Update source's lastCrawledAt
            await prisma.source.update({
                where: { id: source.id },
                data: { lastCrawledAt: new Date() },
            })
        }
    } catch (err: any) {
        errorMessage = err.message
        errors++
    }

    // Update crawl log
    const duration = Date.now() - startTime
    await prisma.crawlLog.update({
        where: { id: logId },
        data: {
            status: errors > 0 && newCreated === 0 ? 'FAILED' : errors > 0 ? 'PARTIAL' : 'SUCCESS',
            finishedAt: new Date(),
            durationMs: duration,
            totalFetched,
            newCreated,
            updated,
            duplicates,
            errors,
            errorMessage,
        },
    })

    console.log(`[Crawler] Done: +${newCreated} new, ${updated} updated, ${duplicates} dupes, ${errors} errors`)
}
