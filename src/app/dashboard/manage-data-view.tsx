'use client'

import { useState, useEffect } from 'react'
import { fetchFilterOptions, fetchScores } from './manage-actions'
import { EditableScoreTable } from './editable-score-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Loader2 } from 'lucide-react'

type FilterOptions = {
  classes: { id: string, name: string }[]
  subjects: { id: string, name: string }[]
  testNames: string[]
}

export function ManageDataView() {
  const [options, setOptions] = useState<FilterOptions>({ classes: [], subjects: [], testNames: [] })
  const [classId, setClassId] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [testName, setTestName] = useState<string>('')
  
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await fetchFilterOptions()
        setOptions(data)
      } catch (error) {
        console.error(error)
      } finally {
        setInitialLoading(false)
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    async function loadScores() {
      if (classId && subjectId && testName) {
        setLoading(true)
        try {
          const data = await fetchScores(classId, subjectId, testName)
          setScores(data)
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      } else {
        setScores([])
      }
    }
    loadScores()
  }, [classId, subjectId, testName])

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl">
        <CardHeader className="pb-6 pt-8 px-8 border-b border-border bg-background/20">
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Database className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"/> 
            </div>
            Manage Records
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            Select a Class, Subject, and Test to view and edit individual student scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class</label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="bg-background/40 border-border text-foreground h-12">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {options.classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="bg-background/40 border-border text-foreground h-12">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {options.subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Name</label>
              <Select value={testName} onValueChange={setTestName}>
                <SelectTrigger className="bg-background/40 border-border text-foreground h-12">
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {options.testNames.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            classId && subjectId && testName && (
              <EditableScoreTable initialScores={scores} />
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
