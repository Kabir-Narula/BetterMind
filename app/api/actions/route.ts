import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  dayLogId: z.string().min(1),
  suggestedAction: z.string().min(3).max(500),
  action: z.enum(['accept', 'complete', 'rate']),
  helpfulnessScore: z.number().int().min(1).max(5).optional(),
  userNote: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { dayLogId, suggestedAction, action, helpfulnessScore, userNote } = parsed.data

    const dayLog = await prisma.dayLog.findFirst({
      where: { id: dayLogId, userId: user.userId },
    })
    if (!dayLog) {
      return NextResponse.json({ error: 'Day log not found' }, { status: 404 })
    }

    let tracking = await prisma.actionTracking.findFirst({
      where: { userId: user.userId, dayLogId, suggestedAction },
    })

    if (!tracking) {
      tracking = await prisma.actionTracking.create({
        data: {
          userId: user.userId,
          dayLogId,
          suggestedAction,
          accepted: action === 'accept' || action === 'complete' || action === 'rate',
          acceptedAt: action === 'accept' ? new Date() : null,
        },
      })
    }

    if (action === 'accept') {
      tracking = await prisma.actionTracking.update({
        where: { id: tracking.id },
        data: { accepted: true, acceptedAt: new Date() },
      })
    }

    if (action === 'complete') {
      tracking = await prisma.actionTracking.update({
        where: { id: tracking.id },
        data: {
          accepted: true,
          acceptedAt: tracking.acceptedAt || new Date(),
          completed: true,
          completedAt: new Date(),
          userNote: userNote || tracking.userNote,
        },
      })
    }

    if (action === 'rate' && helpfulnessScore) {
      tracking = await prisma.actionTracking.update({
        where: { id: tracking.id },
        data: {
          helpfulnessScore,
          userNote: userNote || tracking.userNote,
        },
      })
    }

    return NextResponse.json(tracking)
  } catch (error) {
    console.error('Action tracking error:', error)
    return NextResponse.json({ error: 'Failed to track action' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dayLogId = new URL(request.url).searchParams.get('dayLogId')
    if (!dayLogId) {
      return NextResponse.json({ error: 'dayLogId required' }, { status: 400 })
    }

    const tracking = await prisma.actionTracking.findFirst({
      where: { userId: user.userId, dayLogId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Action tracking GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch action' }, { status: 500 })
  }
}
