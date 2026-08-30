'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateScore } from './manage-actions'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type EditableScore = {
  id: string
  studentId: string
  studentName: string
  rollNumber: string | null
  section: string | null
  marksObtained: number
  totalMarks: number
  isAbsent: boolean
  percentage: number
}

export function EditableScoreTable({ initialScores }: { initialScores: EditableScore[] }) {
  const [scores, setScores] = useState<EditableScore[]>(initialScores)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpdate = (index: number, field: keyof EditableScore, value: any) => {
    const newScores = [...scores]
    const updated = { ...newScores[index], [field]: value }
    
    // Auto-calculate percentage if marks change
    if (field === 'marksObtained' || field === 'totalMarks' || field === 'isAbsent') {
      const obtained = field === 'marksObtained' ? value : updated.marksObtained
      const total = field === 'totalMarks' ? value : updated.totalMarks
      const absent = field === 'isAbsent' ? value : updated.isAbsent
      
      if (absent) {
        updated.percentage = 0
      } else if (total > 0) {
        updated.percentage = Number(((obtained / total) * 100).toFixed(2))
      } else {
        updated.percentage = 0
      }
    }
    
    newScores[index] = updated
    setScores(newScores)
  }

  const handleSave = async (score: EditableScore) => {
    try {
      setLoadingId(score.id)
      await updateScore(score.id, score.marksObtained, score.totalMarks, score.isAbsent)
      toast.success(`Successfully updated score for ${score.studentName}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update score')
    } finally {
      setLoadingId(null)
    }
  }

  if (scores.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground bg-card border border-border rounded-xl mt-6">
        No scores found for this selection.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mt-6 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold w-[20%]">Student Name</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[15%]">Roll No.</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[10%]">Section</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[15%] text-center">Marks Obtained</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[15%] text-center">Total Marks</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[10%] text-center">Absent</TableHead>
              <TableHead className="text-muted-foreground font-semibold w-[15%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scores.map((score, idx) => (
              <TableRow key={score.id} className="border-border hover:bg-card transition-colors">
                <TableCell className="font-medium text-foreground">{score.studentName}</TableCell>
                <TableCell>
                  {score.rollNumber ? (
                    <Badge variant="outline" className="text-muted-foreground border-zinc-700 bg-card/50 font-mono text-xs">
                      {score.rollNumber}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">{score.section || '-'}</TableCell>
                
                <TableCell>
                  <Input 
                    type="number" 
                    value={score.marksObtained}
                    disabled={score.isAbsent}
                    onChange={(e) => handleUpdate(idx, 'marksObtained', parseFloat(e.target.value) || 0)}
                    className="bg-background/50 border-border text-center text-foreground h-9 focus-visible:ring-emerald-500"
                  />
                </TableCell>
                
                <TableCell>
                  <Input 
                    type="number" 
                    value={score.totalMarks}
                    onChange={(e) => handleUpdate(idx, 'totalMarks', parseFloat(e.target.value) || 0)}
                    className="bg-background/50 border-border text-center text-foreground h-9 focus-visible:ring-emerald-500"
                  />
                </TableCell>

                <TableCell className="text-center">
                  <input 
                    type="checkbox" 
                    checked={score.isAbsent}
                    onChange={(e) => handleUpdate(idx, 'isAbsent', e.target.checked)}
                    className="w-4 h-4 accent-primary bg-card border-zinc-700 rounded cursor-pointer"
                  />
                </TableCell>
                
                <TableCell className="text-right">
                  <Button 
                    size="sm"
                    onClick={() => handleSave(score)}
                    disabled={loadingId === score.id || (score.totalMarks <= 0)}
                    className="bg-emerald-600 hover:bg-primary text-foreground shadow-lg shadow-primary/20"
                  >
                    {loadingId === score.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
