import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenderId, content } = await req.json()
    if (!tenderId || !content) {
        return NextResponse.json({ error: 'tenderId and content are required' }, { status: 400 })
    }

    const note = await prisma.internalNote.create({
        data: { tenderId, userId, content },
        include: { user: { select: { name: true } } },
    })
    return NextResponse.json(note, { status: 201 })
}
