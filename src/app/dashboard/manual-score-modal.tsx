'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { addSingleManualScore } from './manage-actions'
import { toast } from 'sonner'

interface ManualScoreModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  subjectId: string
  testName: string
  onSuccess: () => void
}

export function ManualScoreModal({ isOpen, onClose, classId, subjectId, testName, onSuccess }: ManualScoreModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [section, setSection] = useState('')
  const [marksObtained, setMarksObtained] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [isAbsent, setIsAbsent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName || (!isAbsent && !marksObtained) || !totalMarks) {
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Adding manual record...')
    try {
      await addSingleManualScore({
        classId,
        subjectId,
        testName,
        studentName,
        rollNumber,
        section,
        marksObtained: Number(marksObtained),
        totalMarks: Number(totalMarks),
        isAbsent
      })
      toast.success('Record added successfully!', { id: toastId })
      
      // Reset form
      setStudentName('')
      setRollNumber('')
      setSection('')
      setMarksObtained('')
      setTotalMarks('')
      setIsAbsent(false)
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to add record', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Add Record Manually</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the details for {testName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Name *</Label>
            <Input 
              id="studentName" 
              value={studentName} 
              onChange={(e) => setStudentName(e.target.value)} 
              placeholder="e.g. John Doe" 
              className="bg-background/40 border-border h-10"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roll Number</Label>
              <Input 
                id="rollNumber" 
                value={rollNumber} 
                onChange={(e) => setRollNumber(e.target.value)} 
                placeholder="Optional" 
                className="bg-background/40 border-border h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</Label>
              <Input 
                id="section" 
                value={section} 
                onChange={(e) => setSection(e.target.value)} 
                placeholder="Optional" 
                className="bg-background/40 border-border h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marksObtained" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marks Obtained *</Label>
              <Input 
                id="marksObtained" 
                type="number"
                step="0.01"
                value={marksObtained} 
                onChange={(e) => setMarksObtained(e.target.value)} 
                disabled={isAbsent}
                placeholder={isAbsent ? "0" : "Score"} 
                className="bg-background/40 border-border h-10"
                required={!isAbsent}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMarks" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Marks *</Label>
              <Input 
                id="totalMarks" 
                type="number"
                step="0.01"
                value={totalMarks} 
                onChange={(e) => setTotalMarks(e.target.value)} 
                placeholder="Total" 
                className="bg-background/40 border-border h-10"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isAbsent" 
              checked={isAbsent}
              onCheckedChange={(checked) => setIsAbsent(checked === true)}
              className="border-zinc-500 bg-background/50"
            />
            <Label htmlFor="isAbsent" className="text-sm font-medium leading-none cursor-pointer">
              Mark as Absent
            </Label>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="bg-transparent border-border hover:bg-accent/50 text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Save Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
