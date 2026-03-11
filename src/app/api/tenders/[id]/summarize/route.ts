import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tender = await prisma.tender.findUnique({
        where: { id: params.id },
        include: { rawContent: true },
    })
    if (!tender) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const rawText = tender.rawContent?.rawText || ''
    const textToAnalyze = [
        tender.title,
        `Country: ${tender.country}`,
        `Issuer: ${tender.issuer}`,
        tender.category ? `Category: ${tender.category}` : '',
        rawText.slice(0, 3000),
    ].filter(Boolean).join('\n')

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return NextResponse.json({
            error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다. .env.local에 키를 추가해주세요.'
        }, { status: 503 })
    }

    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0.3,
                messages: [
                    {
                        role: 'system',
                        content: `당신은 해외 건설/인프라 입찰 공고를 분석하는 전문 어시스턴트입니다.
공고 내용을 분석하여 한국어로 다음 4가지를 JSON으로 반환하세요:
- summaryShort: 핵심 요약 (2~3문장, 사업 내용·규모·발주처 포함)
- summaryLong: 상세 요약 (5~7문장, 사업 배경·범위·요건)
- qualificationText: 참가 자격 요건 (2~4문장, 없으면 null)
- importantNotes: 주의사항 또는 특이사항 (2~3문장, 없으면 null)

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`,
                    },
                    {
                        role: 'user',
                        content: `다음 입찰 공고를 분석해주세요:\n\n${textToAnalyze}`,
                    },
                ],
                response_format: { type: 'json_object' },
            }),
        })

        if (!openaiRes.ok) {
            const errData = await openaiRes.json()
            return NextResponse.json({ error: `OpenAI API 오류: ${errData.error?.message || openaiRes.statusText}` }, { status: 502 })
        }

        const data = await openaiRes.json()
        const content = JSON.parse(data.choices?.[0]?.message?.content || '{}')

        await prisma.tender.update({
            where: { id: params.id },
            data: {
                summaryShort: content.summaryShort || null,
                summaryLong: content.summaryLong || null,
                qualificationText: content.qualificationText || null,
                importantNotes: content.importantNotes || null,
                aiProcessedAt: new Date(),
                aiModel: 'gpt-4o-mini',
            },
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[AI Summarize]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
