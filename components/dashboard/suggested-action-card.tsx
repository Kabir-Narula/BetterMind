'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SuggestedActionCardProps {
  dayLogId: string
  suggestedAction: string
}

export default function SuggestedActionCard({
  dayLogId,
  suggestedAction,
}: SuggestedActionCardProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'completed'>('pending')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/actions?dayLogId=${dayLogId}`)
      .then(res => res.json())
      .then(data => {
        if (data.tracking?.completed) setStatus('completed')
        else if (data.tracking?.accepted) setStatus('accepted')
      })
      .catch(() => {})
  }, [dayLogId])

  const trackAction = async (action: 'accept' | 'complete') => {
    setLoading(true)
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayLogId, suggestedAction, action }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus(action === 'complete' ? 'completed' : 'accepted')
      toast({
        title: action === 'complete' ? 'Nice work!' : 'Action accepted',
        description: action === 'complete' ? 'You followed through today.' : 'Give it a try when you are ready.',
      })
      if (action === 'complete') router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Could not save.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'completed') {
    return (
      <Card className="p-5 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">You completed today&apos;s suggested action!</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <span className="text-xs font-bold tracking-widest uppercase text-indigo-700">
          Suggested Action
        </span>
      </div>
      <p className="text-gray-800 leading-relaxed mb-4">{suggestedAction}</p>
      <div className="flex gap-3">
        {status === 'pending' && (
          <Button
            onClick={() => trackAction('accept')}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "I'll try this"}
          </Button>
        )}
        <Button
          onClick={() => trackAction('complete')}
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Done!'}
        </Button>
      </div>
    </Card>
  )
}
