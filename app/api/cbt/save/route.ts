import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { CBTService } from '@/lib/cbt-service'
import { cbtSaveSchema, validateInput } from '@/lib/validations'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = validateInput(cbtSaveSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const exercise = await CBTService.saveExercise(user.userId, validation.data)

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('CBT Save error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
