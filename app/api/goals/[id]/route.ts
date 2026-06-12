import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: { id: string }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goal = await prisma.goal.findFirst({
      where: { id: context.params.id, userId: user.userId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const body = await request.json()
    const { completed, note } = body

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
    })

    if (typeof note === 'string' && note.trim()) {
      await prisma.goalCheckIn.create({
        data: {
          goalId: goal.id,
          note: note.trim(),
          completed: completed === true,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Goal PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goal = await prisma.goal.findFirst({
      where: { id: context.params.id, userId: user.userId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goal.delete({ where: { id: goal.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Goal DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
