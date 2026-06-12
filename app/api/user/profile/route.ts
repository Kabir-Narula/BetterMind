import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { userProfileSchema, validateInput } from '@/lib/validations'

// Force dynamic rendering (this route uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = validateInput(userProfileSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const {
      nickname,
      ageGroup,
      lifeStage,
      communicationStyle,
      hobbies,
      currentWellbeing,
      primaryGoals,
    } = validation.data

    let aiPersona = 'supportive-friend'
    if (communicationStyle === 'direct') aiPersona = 'motivational-coach'
    if (communicationStyle === 'reflective' || communicationStyle === 'conversational') {
      aiPersona = 'wise-guide'
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: currentUser.userId },
      create: {
        userId: currentUser.userId,
        ageGroup,
        lifeStage,
        communicationStyle,
        preferredTone: communicationStyle,
        hobbies,
        currentWellbeing,
        primaryGoals,
        aiPersona,
        onboardingComplete: true,
        onboardedAt: new Date(),
      },
      update: {
        ageGroup,
        lifeStage,
        communicationStyle,
        preferredTone: communicationStyle,
        hobbies,
        currentWellbeing,
        primaryGoals,
        aiPersona,
        onboardingComplete: true,
        onboardedAt: new Date(),
      },
    })

    if (nickname) {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: { name: nickname },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[PROFILE_CREATE]', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
