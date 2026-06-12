'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Target, Plus, Check, Trash2, Loader2 } from 'lucide-react'

interface Goal {
  id: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
}

export default function GoalsPageClient() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setGoals(data.goals || [])
    } catch {
      toast({ title: 'Error', description: 'Could not load goals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const addGoal = async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed')
      setNewTitle('')
      await loadGoals()
      toast({ title: 'Goal added', description: 'One step at a time.' })
    } catch {
      toast({ title: 'Error', description: 'Could not add goal', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleComplete = async (goal: Goal) => {
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !goal.completed }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadGoals()
    } catch {
      toast({ title: 'Error', description: 'Could not update goal', variant: 'destructive' })
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await loadGoals()
    } catch {
      toast({ title: 'Error', description: 'Could not delete goal', variant: 'destructive' })
    }
  }

  const active = goals.filter(g => !g.completed)
  const completed = goals.filter(g => g.completed)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 space-y-10">
      <div className="border-b border-gray-200 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-indigo-600" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">Goals</h1>
        </div>
        <p className="text-gray-500">Track what you&apos;re working toward.</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Meditate 10 minutes daily"
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
          />
          <Button onClick={addGoal} disabled={submitting || !newTitle.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400">Active</h2>
            {active.length === 0 ? (
              <p className="text-gray-400 italic">No active goals. Add one above.</p>
            ) : (
              active.map(goal => (
                <Card key={goal.id} className="p-4 flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-900">{goal.title}</span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => toggleComplete(goal)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </section>

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400">Completed</h2>
              {completed.map(goal => (
                <Card key={goal.id} className="p-4 flex items-center justify-between gap-4 opacity-60">
                  <span className="line-through text-gray-600">{goal.title}</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
