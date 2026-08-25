'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getTestsAction, deleteTestAction } from './test-actions'

type TestInfo = {
  id: string
  testName: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
}

export function TestManagementView() {
  const [tests, setTests] = useState<TestInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTests = async () => {
    setLoading(true)
    const res = await getTestsAction()
    if (res.success && res.tests) {
      setTests(res.tests)
    } else {
      toast.error(res.error || 'Failed to load tests')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTests()
  }, [])

  const handleDelete = async (t: TestInfo) => {
    if (!confirm(`Are you sure you want to permanently delete "${t.testName}" for ${t.className} - ${t.subjectName}? This will remove all scores for all students in this test.`)) {
      return
    }

    setDeletingId(t.id)
    const res = await deleteTestAction(t.classId, t.subjectId, t.testName)
    if (res.success) {
      toast.success(res.message)
      await loadTests()
    } else {
      toast.error(res.error || 'Failed to delete test')
    }
    setDeletingId(null)
  }

  return (
    <Card className="w-full max-w-4xl bg-white/5 border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <CardHeader className="pb-4 pt-8 px-8">
        <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
          <Calendar className="w-6 h-6 text-red-400" />
          Manage Past Tests
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Delete incorrect or duplicate test uploads across entire classes.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 italic border border-dashed border-white/10 rounded-2xl">
            No tests found in the database.
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((t) => (
              <div key={t.id} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                <div>
                  <div className="font-bold text-lg text-zinc-200">{t.testName}</div>
                  <div className="text-sm text-zinc-500 font-medium mt-1">
                    <span className="text-blue-400">{t.className}</span> &bull; <span className="text-emerald-400">{t.subjectName}</span>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="icon"
                  disabled={deletingId === t.id}
                  onClick={() => handleDelete(t)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
