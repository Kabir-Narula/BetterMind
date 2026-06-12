import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDateForDB, getTodayInTimezone } from '@/lib/timezone'
import { intentionSchema, validateInput } from '@/lib/validations'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateInput(intentionSchema, { intention: body.intention })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { intention } = validation.data
    const { localDate } = body

    // Use client-provided local date (YYYY-MM-DD format) if available
    // This ensures the correct calendar date in Toronto timezone is used
    // Falls back to server's Toronto date if not provided
    let targetDate: Date
    if (localDate && typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      targetDate = parseDateForDB(localDate)
    } else {
      targetDate = getTodayInTimezone()
    }

    const dayLog = await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: user.userId,
          date: targetDate
        }
      },
      create: {
        userId: user.userId,
        date: targetDate,
        morningIntention: intention
      },
      update: {
        morningIntention: intention
      }
    })

    return NextResponse.json({
      success: true,
      dayLog,
      message: 'Morning intention saved'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error saving intention:', error)
    return NextResponse.json(
      { error: 'Failed to save intention' },
      { status: 500 }
    )
  }
}
