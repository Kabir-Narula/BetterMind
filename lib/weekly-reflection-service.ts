import { prisma } from './prisma'
import { openai, GPT_MODEL_FAST, withRetry } from './openai'
import { parseAIJSON } from './utils'
import { subDays, startOfWeek } from 'date-fns'
import { formatInToronto, parseDateForDB } from './timezone'

interface WeeklyReflectionAI {
  bestMoment: string
  hardestMoment: string
  howHandled: string
  adviceForNextWeek: string
  bestDay: string
  toughestDay: string
}

export class WeeklyReflectionService {
  /**
   * Generate or return the weekly reflection for the current week.
   * Requires at least one journal or mood entry in the past 7 days.
   */
  static async generateForUser(userId: string) {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekOf = parseDateForDB(formatInToronto(weekStart, 'yyyy-MM-dd'))

    const existing = await prisma.weeklyReflection.findFirst({
      where: { userId, weekOf },
    })
    if (existing) return existing

    const since = subDays(now, 7)

    const [journals, moods, dayLogs] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true, moodRating: true, createdAt: true },
      }),
      prisma.moodEntry.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { moodScore: true, note: true, createdAt: true },
      }),
      prisma.dayLog.findMany({
        where: { userId, date: { gte: weekOf } },
        select: { morningIntention: true, eveningReflection: true, date: true },
      }),
    ])

    if (journals.length === 0 && moods.length === 0) {
      return null
    }

    const avgMood =
      moods.length > 0
        ? moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length
        : journals.length > 0
          ? journals.reduce((sum, j) => sum + j.moodRating, 0) / journals.length
          : null

    const journalSummaries = journals
      .slice(0, 8)
      .map(
        (j) =>
          `- ${formatInToronto(j.createdAt, 'MMM d')}: "${j.title}" (mood ${j.moodRating}/10) — ${j.content.substring(0, 120)}`
      )
      .join('\n')

    const moodSummaries = moods
      .slice(0, 10)
      .map((m) => `- ${formatInToronto(m.createdAt, 'MMM d')}: ${m.moodScore}/10${m.note ? ` — ${m.note}` : ''}`)
      .join('\n')

    const prompt = `You are a warm wellness coach summarizing someone's week.
Based on their data, write a concise weekly reflection.

JOURNAL ENTRIES (past 7 days):
${journalSummaries || 'None'}

MOOD CHECK-INS:
${moodSummaries || 'None'}

DAY INTENTIONS/REFLECTIONS:
${dayLogs.map((d) => `- Intention: ${d.morningIntention || 'none'} | Evening: ${d.eveningReflection || 'none'}`).join('\n') || 'None'}

Average mood this week: ${avgMood?.toFixed(1) ?? 'unknown'}

Return JSON only:
{
  "bestMoment": "1-2 sentences about their best moment",
  "hardestMoment": "1-2 sentences about their hardest moment",
  "howHandled": "1-2 sentences on how they coped",
  "adviceForNextWeek": "1 practical suggestion for next week",
  "bestDay": "day name or date",
  "toughestDay": "day name or date"
}`

    const completion = await withRetry(() =>
      openai.chat.completions.create({
        model: GPT_MODEL_FAST,
        messages: [
          { role: 'system', content: 'Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      })
    )

    const ai = parseAIJSON<WeeklyReflectionAI>(completion.choices[0]?.message?.content || '', {
      bestMoment: 'You showed up this week — that matters.',
      hardestMoment: 'Some days felt heavier than others.',
      howHandled: 'You kept checking in, which is a real skill.',
      adviceForNextWeek: 'Pick one small habit to repeat next week.',
      bestDay: 'Mid-week',
      toughestDay: 'Start of week',
    })

    const daysJournaled = new Set(
      journals.map((j) => formatInToronto(j.createdAt, 'yyyy-MM-dd'))
    ).size

    const moodTrend =
      avgMood === null
        ? 'stable'
        : avgMood >= 7
          ? 'improving'
          : avgMood <= 4
            ? 'declining'
            : 'stable'

    return prisma.weeklyReflection.create({
      data: {
        userId,
        weekOf,
        bestMoment: ai.bestMoment,
        hardestMoment: ai.hardestMoment,
        howHandled: ai.howHandled,
        adviceForNextWeek: ai.adviceForNextWeek,
        avgMood,
        daysJournaled,
        bestDay: ai.bestDay,
        toughestDay: ai.toughestDay,
        moodTrend,
      },
    })
  }
}
