'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, MessageCircle } from 'lucide-react'
import Link from 'next/link'

// Get icon based on message type
function getMessageIcon(type: string, icon?: string) {
    if (icon) return <span className="text-lg shrink-0">{icon}</span>

    switch (type) {
        case 'improvement':
            return <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        case 'decline':
            return <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        case 'achievement':
        case 'streak':
            return <span className="text-lg shrink-0">🎉</span>
        case 'pattern':
            return <span className="text-lg shrink-0">✨</span>
        case 'inactivity':
            return <span className="text-lg shrink-0">👋</span>
        default:
            return <MessageCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
    }
}

// Get background color based on message type
function getMessageBg(type: string) {
    switch (type) {
        case 'improvement':
            return 'bg-green-50 border-green-100'
        case 'decline':
            return 'bg-blue-50 border-blue-100'
        case 'achievement':
        case 'streak':
            return 'bg-amber-50 border-amber-100'
        case 'pattern':
            return 'bg-purple-50 border-purple-100'
        default:
            return 'bg-white border-indigo-100'
    }
}

export default function AIProactiveCoach({ userId }: { userId: string }) {
    const [insights, setInsights] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch('/api/ai-coach')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load coach insights')
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data.messages)) {
                    setInsights(data)
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [userId])

    if (loading) {
        return (
            <Card className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-slate-200 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
            </Card>
        )
    }

    if (!insights?.messages?.length) return null

    return (
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💭</span>
                <h3 className="font-medium text-gray-800">Hey there</h3>
            </div>

            <div className="space-y-3">
                {insights.messages.map((msg: any, idx: number) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getMessageBg(msg.type)}`}
                    >
                        {getMessageIcon(msg.type, msg.icon)}
                        <p className="text-sm text-gray-700 flex-1 leading-relaxed">{msg.message}</p>
                    </div>
                ))}
            </div>

            {insights.suggestedAction && (
                <Link href={insights.suggestedAction.link}>
                    <div className="mt-4 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-center cursor-pointer transition-all hover:shadow-md">
                        <p className="text-sm font-medium flex items-center justify-center gap-2">
                            {insights.suggestedAction.icon && <span>{insights.suggestedAction.icon}</span>}
                            {insights.suggestedAction.text}
                        </p>
                    </div>
                </Link>
            )}
        </Card>
    )
}
