import { prisma } from './prisma'

export class ChatService {
  static async getOrCreateSession(
    userId: string,
    sessionId?: string,
    journalEntryId?: string
  ) {
    if (sessionId) {
      const existing = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      })
      if (existing) return existing
    }

    return prisma.chatSession.create({
      data: {
        userId,
        title: 'AI Companion Chat',
        journalEntryId: journalEntryId || null,
      },
    })
  }

  static async saveMessages(
    sessionId: string,
    userId: string,
    userContent: string,
    assistantContent: string
  ) {
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { sessionId, userId, role: 'user', content: userContent },
      }),
      prisma.chatMessage.create({
        data: { sessionId, userId, role: 'assistant', content: assistantContent },
      }),
      prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }),
    ])
  }

  static async getSessionMessages(sessionId: string, userId: string, limit = 20) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    })
    if (!session) return []

    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { role: true, content: true, createdAt: true },
    })
  }

  static async getLatestSession(userId: string) {
    return prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }
}
