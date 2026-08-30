'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PowerOff } from 'lucide-react'
import { endTestManually } from './end-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function EndTestButton({ testId, isActive }: { testId: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEndTest = async () => {
    if (!confirm('Are you sure you want to end this test for everyone? This will immediately submit all in-progress tests and prevent anyone else from joining.')) {
      return
    }

    setLoading(true)
    try {
      await endTestManually(testId)
      toast.success('Test ended successfully. All in-progress attempts have been submitted.')
      router.refresh()
    } catch (e: any) {
      toast.error('Failed to end test: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return (
      <Button variant="outline" disabled className="text-muted-foreground">
        Test is Ended
      </Button>
    )
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleEndTest} 
      disabled={loading}
      className="shadow-lg font-bold"
    >
      <PowerOff className="w-4 h-4 mr-2" />
      {loading ? 'Ending...' : 'End Test for Everyone'}
    </Button>
  )
}
