import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runCrawler } from '@/lib/crawler'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { sourceId } = await req.json()

    // Create crawl log entry
    const log = await prisma.crawlLog.create({
        data: {
            sourceId: sourceId || null,
            status: 'RUNNING',
            triggeredBy: 'manual',
        },
    })

    // Run async (don't await so the response is immediate)
    runCrawler(sourceId, log.id).catch(console.error)

    return NextResponse.json({
        message: '크롤링을 시작했습니다.',
        logId: log.id,
    })
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const logs = await prisma.crawlLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50,
        include: { source: { select: { name: true } } },
    })
    return NextResponse.json(logs)
}
