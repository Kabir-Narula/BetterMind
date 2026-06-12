import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { dayLogId } = body

    if (!dayLogId || typeof dayLogId !== 'string') {
      return NextResponse.json({ error: 'Missing day log ID' }, { status: 400 })
    }

    const synthesisSchema = z.object({
      reflection: z
        .string()
        .trim()
        .min(1, 'Reflection is required')
        .max(500, 'Reflection must be 500 characters or less'),
    })

    const parsed = synthesisSchema.safeParse({ reflection: body.reflection })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid reflection' },
        { status: 400 }
      )
    }

    const { reflection } = parsed.data

    // Verify the day log belongs to the authenticated user (prevent IDOR)
    const dayLog = await prisma.dayLog.findFirst({
      where: {
        id: dayLogId,
        userId: user.userId,
      },
    })

    if (!dayLog) {
      return NextResponse.json({ error: 'Day log not found' }, { status: 404 })
    }

    const updated = await prisma.dayLog.update({
      where: { id: dayLogId },
      data: { eveningReflection: reflection },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Day log synthesis error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
