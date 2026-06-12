import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moodSchema } from '@/lib/validations'
import { invalidateStreakCache } from '@/lib/streak-service'
import { getTodayInTimezone } from '@/lib/timezone'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Zod Validation
    const validation = moodSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { score, type, context } = validation.data
    const todayDate = getTodayInTimezone()

    // Ensure a day log exists for today so entries stay grouped correctly
    const dayLog = await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: user.userId,
          date: todayDate,
        },
      },
      create: {
        userId: user.userId,
        date: todayDate,
      },
      update: {},
    })

    // Create snapshot and mood entry in parallel
    const [snapshot] = await Promise.all([
      prisma.moodSnapshot.create({
        data: {
          userId: user.userId,
          moodScore: score,
          type,
          context,
        }
      }),
      prisma.moodEntry.create({
        data: {
          userId: user.userId,
          moodScore: score,
          note: context || 'Pulse Check',
          triggers: [],
          dayLogId: dayLog.id,
        }
      })
    ])

    invalidateStreakCache(user.userId)

    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
