import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { CBTService } from '@/lib/cbt-service'
import { cbtThoughtSchema, validateInput } from '@/lib/validations'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.error('[CBT API] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = validateInput(cbtThoughtSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { thought, step, conversation } = validation.data
    console.log(`[CBT API] Step: ${step}, UserId: ${user.userId.substring(0, 8)}...`)

    if (step === 'validate') {
      // Step 1: Generate Questions
      console.log('[CBT API] Generating challenge questions for thought:', thought.substring(0, 50))

      try {
        const questions = await CBTService.generateChallengeQuestions(thought, user.userId)
        console.log(`[CBT API] Got ${questions.length} questions`)

        // Extract just the question strings for the frontend
        const questionStrings = questions.map(q =>
          typeof q === 'string' ? q : q.question
        )
        return NextResponse.json({ questions: questionStrings })
      } catch (error) {
        console.error('[CBT API] Failed to generate questions:', error)
        return NextResponse.json({
          error: 'Failed to generate questions',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (step === 'reframe') {
      // Step 2: Generate Reframe
      console.log('[CBT API] Generating reframe...')

      if (!conversation || conversation.length === 0) {
        return NextResponse.json(
          { error: 'Conversation is required for reframe step' },
          { status: 400 }
        )
      }

      try {
        const reframe = await CBTService.generateReframe(thought, conversation, user.userId)
        console.log(`[CBT API] Got reframe:`, reframe)

        // Ensure we return a string
        const reframeText = typeof reframe === 'string'
          ? reframe
          : reframe?.reframedThought || String(reframe)

        return NextResponse.json({ reframe: reframeText })
      } catch (error) {
        console.error('[CBT API] Failed to generate reframe:', error)
        return NextResponse.json({
          error: 'Failed to generate reframe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    console.error('[CBT API] Error:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
