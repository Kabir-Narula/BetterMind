import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ChatService } from '@/lib/chat-service'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await ChatService.getOrCreateSession(user.userId)
    return NextResponse.json({ sessionId: session.id, messages: [] })
  } catch (error) {
    console.error('[Chat Session API] Error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
