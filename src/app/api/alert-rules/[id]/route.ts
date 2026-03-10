import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const rule = await prisma.alertRule.update({
        where: { id: params.id, userId },
        data: body,
    })
    return NextResponse.json(rule)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.alertRule.delete({ where: { id: params.id, userId } })
    return NextResponse.json({ success: true })
}
