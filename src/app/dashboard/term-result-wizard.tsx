'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, UploadCloud, CheckCircle2, Loader2, ArrowRight, BookOpen, Calculator, X } from 'lucide-react'
import { uploadMarksAction, deleteUploadedMarksAction } from './actions'
import { toast } from 'sonner'

const CLASS_SUBJECTS: Record<string, string[]> = {
  '1': ['Math', 'English', 'Urdu', 'General Knowledge'],
  '2': ['Math', 'English', 'Urdu', 'General Knowledge'],
  '3': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'Computer Science'],
  '4': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'Computer Science'],
  '5': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'Computer Science'],
  '6': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'History', 'Geography', 'Computer Science'],
  '7': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'History', 'Geography', 'Computer Science'],
  '8': ['English', 'Urdu', 'Islamiyat', 'Math', 'Science', 'History', 'Geography', 'Computer Science'],
  '9': ['Physics', 'Chemistry', 'Biology', 'Math', 'Computer Science', 'Urdu', 'English', 'Islamiyat', 'Pak Study'],
  '10': ['Physics', 'Chemistry', 'Biology', 'Math', 'Computer Science', 'Urdu', 'English', 'Islamiyat', 'Pak Study'],
  '11': ['Physics', 'Chemistry', 'Biology', 'Math', 'Computer Science', 'Urdu', 'English', 'Islamiyat', 'Pak Study'],
  '12': ['Physics', 'Chemistry', 'Biology', 'Math', 'Computer Science', 'Urdu', 'English', 'Islamiyat', 'Pak Study'],
}

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

export function TermResultWizard() {
  const [step, setStep] = useState(1)
  
  // State for selections
  const [term, setTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  
  // State for uploads
  const [uploadedSubjects, setUploadedSubjects] = useState<string[]>([])
  const [uploadingSubject, setUploadingSubject] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const subjectsRequired = selectedClass ? CLASS_SUBJECTS[selectedClass] || [] : []
  const isFinished = subjectsRequired.length > 0 && uploadedSubjects.length === subjectsRequired.length

  async function handleFileUpload(subject: string, file: File) {
    if (!file) return

    setUploadingSubject(subject)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('className', `Class ${selectedClass}`)
      formData.append('subjectName', subject)
      formData.append('testName', term)
      formData.append('totalMarks', totalMarks)

      const result = await uploadMarksAction(formData)
      if (result.success) {
        toast.success(`Successfully uploaded marks for ${subject}!`)
        setUploadedSubjects(prev => [...prev, subject])
      } else {
        toast.error(result.error || `Failed to upload ${subject}`)
      }
    } catch (e) {
      toast.error('An unexpected error occurred.')
    } finally {
      setUploadingSubject(null)
    }
  }

  async function handleGeneratePDF() {
    setIsGenerating(true)
    try {
      // Open the unified PDF generation route
      // We encode the Class Name and Test Name to fetch the correct data
      const className = encodeURIComponent(`Class ${selectedClass}`)
      const termName = encodeURIComponent(term)
      window.open(`/pdf/term-result?className=${className}&testName=${termName}`, '_blank')
    } catch (error) {
      toast.error('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  function resetWizard() {
    setStep(1)
    setTerm('')
    setSelectedClass('')
    setTotalMarks('100')
    setUploadedSubjects([])
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="bg-white/5 border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>

        <CardHeader className="pb-6 pt-10 px-8 border-b border-white/10 bg-black/20">
          <CardTitle className="flex items-center justify-between text-2xl font-black tracking-tight text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              Term Result Wizard
            </div>
            <span className="text-sm font-medium text-zinc-500">Step {step} of 3</span>
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-2">
            Upload marks subject by subject for a major term exam to generate a unified PDF result card.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 py-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-zinc-300 font-semibold uppercase tracking-wider text-xs">Select Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-12">
                      <SelectValue placeholder="E.g., First Term, Final Term" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Final Term">Final Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-zinc-300 font-semibold uppercase tracking-wider text-xs">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-12">
                      <SelectValue placeholder="Choose Class (1-12)" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                      {CLASS_OPTIONS.map(c => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 font-semibold uppercase tracking-wider text-xs">Default Total Marks per Subject</Label>
                <Input 
                  type="number" 
                  value={totalMarks} 
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-12 max-w-[200px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
              <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400">
                <div>
                  <span className="font-bold text-lg block">Class {selectedClass} - {term}</span>
                  <span className="text-sm opacity-80">{uploadedSubjects.length} of {subjectsRequired.length} subjects uploaded</span>
                </div>
                {isFinished && (
                  <div className="flex items-center gap-2 font-bold bg-emerald-500 text-black px-4 py-2 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" /> All Uploaded!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectsRequired.map(subject => {
                  const isUploaded = uploadedSubjects.includes(subject)
                  const isUploading = uploadingSubject === subject

                  return (
                    <div key={subject} className={`p-4 rounded-xl border transition-all ${isUploaded ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 font-semibold text-zinc-200">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          {subject}
                        </div>
                        {isUploaded && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 ml-2"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to remove the uploaded marks for ${subject}?`)) return
                                const res = await deleteUploadedMarksAction(`Class ${selectedClass}`, subject, term)
                                if (res.success) {
                                  toast.success(`Removed ${subject} marks.`)
                                  setUploadedSubjects(prev => prev.filter(s => s !== subject))
                                } else {
                                  toast.error(res.error)
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {!isUploaded && (
                        <div className="relative group">
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(subject, file)
                            }}
                            disabled={isUploading}
                          />
                          <Button 
                            variant="secondary" 
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-none h-10"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            {isUploading ? 'Uploading...' : 'Upload Excel'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white">Ready to Generate!</h3>
                <p className="text-zinc-400 text-lg max-w-md">
                  All {subjectsRequired.length} subjects for Class {selectedClass} have been successfully uploaded for {term}.
                </p>
              </div>
              <Button 
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-14 px-8 text-lg mt-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Calculator className="w-6 h-6 mr-3" />}
                {isGenerating ? 'Generating...' : 'Generate Term PDF'}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-8 py-6 border-t border-white/10 bg-black/20 flex justify-between">
          <Button 
            variant="ghost" 
            onClick={resetWizard}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Reset
          </Button>
          
          {step === 1 && (
            <Button 
              onClick={() => setStep(2)}
              disabled={!term || !selectedClass}
              className="bg-white text-black hover:bg-zinc-200"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 2 && (
            <Button 
              onClick={() => setStep(3)}
              disabled={!isFinished}
              className="bg-white text-black hover:bg-zinc-200 disabled:bg-white/10 disabled:text-white/30"
            >
              Review & Generate
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
