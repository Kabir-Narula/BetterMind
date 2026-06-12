import { Card } from '@/components/ui/card'
import { Brain } from 'lucide-react'
import ThoughtChallenge from '@/components/cbt/thought-challenge'

export const dynamic = 'force-dynamic'

export default function ExercisesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Mental Exercises</h1>
        <p className="text-gray-500">Tools to help you reframe thoughts and build resilience.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-6 border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/50">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cognitive Reframing</h2>
                <p className="text-sm text-gray-500">Challenge negative thoughts with logic.</p>
              </div>
            </div>
          </div>
          <ThoughtChallenge />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none grayscale">
          <Card className="p-6">
            <h3 className="font-bold mb-2">Box Breathing</h3>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold mb-2">5-4-3-2-1 Grounding</h3>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
