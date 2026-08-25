'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { fetchClassSubjects } from '@/app/actions/result-card-actions'
import { Loader2, ScrollText, AlertCircle } from 'lucide-react'

type Subject = {
  id: string
  name: string
}

interface ResultCardModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  uniqueTests: string[]
  selectedStudentCount: number
  onGenerate: (selectedTests: string[]) => void
}

export function ResultCardModal({ isOpen, onClose, classId, uniqueTests, selectedStudentCount, onGenerate }: ResultCardModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      loadSubjects()
    }
  }, [isOpen, classId])

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const data = await fetchClassSubjects(classId)
      setSubjects(data)
      
      // Select all tests by default
      setSelectedTests(new Set(uniqueTests))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleTestToggle = (test: string) => {
    const next = new Set(selectedTests)
    if (next.has(test)) {
      next.delete(test)
    } else {
      next.add(test)
    }
    setSelectedTests(next)
  }

  const handleGenerate = () => {
    onGenerate(Array.from(selectedTests))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-zinc-950 text-white border-zinc-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-emerald-400" />
            Generate Final Result Card
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure the final result card for {selectedStudentCount} selected student(s).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">1. Include Tests</h3>
              <p className="text-xs text-zinc-500">Scores from selected tests will be aggregated for the final calculation.</p>
              
              {uniqueTests.length === 0 ? (
                <div className="p-4 bg-zinc-900/50 rounded-lg text-sm text-zinc-400 flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  No tests found for this class.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {uniqueTests.map(test => (
                    <div key={test} className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => handleTestToggle(test)}>
                      <Checkbox id={`test-${test}`} checked={selectedTests.has(test)} onCheckedChange={() => handleTestToggle(test)} />
                      <Label htmlFor={`test-${test}`} className="flex-1 cursor-pointer font-medium text-zinc-300">{test}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 border-t border-zinc-800 pt-4">
          <Button variant="outline" onClick={onClose} className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || selectedTests.size === 0} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          >
            <ScrollText className="w-4 h-4 mr-2" />
            Generate PDFs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
