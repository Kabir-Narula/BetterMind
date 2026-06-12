import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { goalSchema, validateInput } from '@/lib/validations'
import { getTodayInTimezone } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId: user.userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Goals GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateInput(goalSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { title, description, targetDate } = validation.data
    const todayDate = getTodayInTimezone()

    const dayLog = await prisma.dayLog.upsert({
      where: {
        userId_date: { userId: user.userId, date: todayDate },
      },
      create: { userId: user.userId, date: todayDate },
      update: {},
    })

    const goal = await prisma.goal.create({
      data: {
        userId: user.userId,
        title,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        dayLogId: dayLog.id,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Goals POST error:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
