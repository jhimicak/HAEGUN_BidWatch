import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { summarizeTender } from '@/lib/ai-summarize'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenderId, rawText, force = false } = await req.json()

    if (!tenderId) return NextResponse.json({ error: 'tenderId required' }, { status: 400 })

    // Check if already summarized
    const tender = await prisma.tender.findUnique({ where: { id: tenderId } })
    if (!tender) return NextResponse.json({ error: 'Tender not found' }, { status: 404 })

    if (tender.summaryShort && !force) {
        return NextResponse.json({
            message: 'Already summarized',
            summaryShort: tender.summaryShort,
            summaryLong: tender.summaryLong,
        })
    }

    // Get raw text if not provided
    let textToSummarize = rawText
    if (!textToSummarize) {
        const raw = await prisma.tenderRawContent.findUnique({ where: { tenderId } })
        textToSummarize = raw?.rawText || `${tender.title}\n${tender.issuer}\n${tender.country}`
    }

    try {
        const summary = await summarizeTender(textToSummarize)

        const updated = await prisma.tender.update({
            where: { id: tenderId },
            data: {
                summaryShort: summary.summary_short,
                summaryLong: summary.summary_long,
                qualificationText: summary.qualification_text,
                importantNotes: summary.important_notes,
                aiProcessedAt: new Date(),
                aiModel: summary.model,
            },
        })

        return NextResponse.json({
            success: true,
            ...summary,
            tender: { id: updated.id },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
