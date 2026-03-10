/**
 * AI 요약 모듈
 * OpenAI API가 없을 때는 mock 요약을 반환합니다.
 */

export interface TenderSummary {
    summary_short: string
    summary_long: string
    qualification_text: string
    important_notes: string
    model: string
}

const SYSTEM_PROMPT = `너는 해외 건설 입찰공고를 분석하는 전문 어시스턴트다.
주어진 공고문에서 실무자가 빠르게 판단할 수 있도록 핵심 내용만 한국어로 정리하라.

반드시 아래 형식으로 출력하라. (JSON 형식으로)

{
  "summary_short": "3문장 이내의 짧은 요약",
  "summary_long": "실무자가 읽는 상세 요약. 어떤 사업인지, 발주처는 누구인지, 어느 국가/지역 사업인지, 계약 방식 또는 사업 유형, 마감일 또는 중요한 일정, 참가 자격 핵심 요건을 포함",
  "qualification_text": "입찰 참가자가 특히 확인해야 하는 자격 요건 정리",
  "important_notes": "주의할 점, 리스크 포인트, 누락하기 쉬운 사항을 bullet 없이 문장형으로 정리"
}

주의사항:
- 원문에 없는 내용은 추정하지 말 것
- 날짜와 금액은 가능한 한 원문 기준으로 정확히 유지할 것
- 불확실하면 "원문 확인 필요"라고 명시할 것
- 한국어로 명확하고 짧게 작성할 것`

function mockSummary(rawText: string): TenderSummary {
    const truncated = rawText.slice(0, 200)
    return {
        summary_short: `[Mock] ${truncated.slice(0, 100)}... (실제 OpenAI API 키가 설정되면 자동으로 AI 요약이 생성됩니다.)`,
        summary_long: `[Mock 상세 요약]\n\n이 공고는 ${truncated.slice(0, 150)} 등의 내용을 포함합니다.\n\nOpenAI API 키(OPENAI_API_KEY)를 .env.local에 설정하면 실제 AI 요약이 생성됩니다.`,
        qualification_text: '[Mock] 원문 확인 필요. OpenAI API 키 설정 후 실제 자격 요건 분석이 제공됩니다.',
        important_notes: '[Mock] 실제 중요사항은 OpenAI API 키 설정 후 확인 가능합니다. 현재는 Mock 데이터가 표시되고 있습니다.',
        model: 'mock',
    }
}

export async function summarizeTender(rawText: string): Promise<TenderSummary> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey || apiKey.startsWith('sk-your')) {
        console.warn('[AI Summarize] No valid OpenAI API key found. Returning mock summary.')
        return mockSummary(rawText)
    }

    try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey })

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `다음 입찰공고를 분석해줘:\n\n${rawText.slice(0, 8000)}` },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('Empty response from OpenAI')

        const parsed = JSON.parse(content)
        return {
            summary_short: parsed.summary_short || '',
            summary_long: parsed.summary_long || '',
            qualification_text: parsed.qualification_text || '',
            important_notes: parsed.important_notes || '',
            model: 'gpt-4o-mini',
        }
    } catch (err: any) {
        console.error('[AI Summarize] Error:', err.message)
        if (err.message.includes('API key')) {
            return mockSummary(rawText)
        }
        throw err
    }
}
