'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FileText, UploadCloud, CheckCircle2, Loader2, ArrowRight, BookOpen, Calculator, X, Download } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { uploadMarksAction, deleteUploadedMarksAction, uploadMasterMarksAction, getTestNamesForClassAction } from './actions'
import { toast } from 'sonner'
import * as xlsx from 'xlsx'

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
  const [subjectTotalMarks, setSubjectTotalMarks] = useState<Record<string, string>>({})
  const [subjectsRequired, setSubjectsRequired] = useState<string[]>([])
  
  // Custom subject states
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectTotalMarks, setNewSubjectTotalMarks] = useState('100')
  
  // State for uploads
  const [uploadMode, setUploadMode] = useState<'individual' | 'master'>('individual')
  const [uploadedSubjects, setUploadedSubjects] = useState<string[]>([])
  const [uploadingSubject, setUploadingSubject] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Master upload state
  const [isMasterUploaded, setIsMasterUploaded] = useState(false)
  const [isMasterUploading, setIsMasterUploading] = useState(false)

  // Report card terms selection
  const [isSelectTermsOpen, setIsSelectTermsOpen] = useState(false)
  const [availableTerms, setAvailableTerms] = useState<string[]>([])
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [isLoadingTerms, setIsLoadingTerms] = useState(false)

  const isFinished = uploadMode === 'individual' 
    ? (subjectsRequired.length > 0 && uploadedSubjects.length === subjectsRequired.length)
    : isMasterUploaded

  function handleAddSubject() {
    if (!newSubjectName.trim()) return
    const name = newSubjectName.trim()
    if (!subjectsRequired.includes(name)) {
      setSubjectsRequired(prev => [...prev, name])
      setSubjectTotalMarks(prev => ({ ...prev, [name]: newSubjectTotalMarks }))
    }
    setNewSubjectName('')
    setNewSubjectTotalMarks('100')
    setIsAddSubjectOpen(false)
  }

  async function handleFileUpload(subject: string, file: File) {
    if (!file) return

    setUploadingSubject(subject)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('className', `Class ${selectedClass}`)
      formData.append('subjectName', subject)
      formData.append('testName', term)
      formData.append('totalMarks', subjectTotalMarks[subject] || '100')

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

  async function handleMasterFileUpload(file: File) {
    if (!file) return

    setIsMasterUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('className', `Class ${selectedClass}`)
      formData.append('testName', term)
      formData.append('subjectTotalMarks', JSON.stringify(subjectTotalMarks))
      formData.append('subjects', JSON.stringify(subjectsRequired))

      const result = await uploadMasterMarksAction(formData)
      if (result.success) {
        toast.success(result.message || 'Master sheet uploaded successfully!')
        setIsMasterUploaded(true)
      } else {
        toast.error(result.error || 'Failed to upload master sheet')
      }
    } catch (e) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsMasterUploading(false)
    }
  }

  function downloadSingleTemplate(subject: string) {
    const ws = xlsx.utils.json_to_sheet([
      { 'Roll Number': '', 'Name': '', 'Obtained Marks': '', 'Total Marks': subjectTotalMarks[subject] || '100' }
    ])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Marks')
    xlsx.writeFile(wb, `${subject}_Template.xlsx`)
  }

  function downloadMasterTemplate() {
    const header: any = { 'Roll Number': '', 'Name': '' }
    subjectsRequired.forEach(sub => {
      header[sub] = ''
    })
    const ws = xlsx.utils.json_to_sheet([header])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Master Marks')
    xlsx.writeFile(wb, `Master_Class_${selectedClass}_Template.xlsx`)
  }

  async function openGenerateDialog() {
    setIsLoadingTerms(true)
    setIsSelectTermsOpen(true)
    const res = await getTestNamesForClassAction(`Class ${selectedClass}`)
    if (res.success && res.testNames) {
      setAvailableTerms(res.testNames)
      // By default, select the current term
      if (!selectedTerms.includes(term)) {
        setSelectedTerms([term])
      }
    } else {
      toast.error('Failed to load available terms')
    }
    setIsLoadingTerms(false)
  }

  function handleProceedToPDF() {
    if (selectedTerms.length === 0) {
      toast.error('Please select at least one term')
      return
    }
    
    setIsGenerating(true)
    try {
      const className = encodeURIComponent(`Class ${selectedClass}`)
      const termsJoined = encodeURIComponent(selectedTerms.join(','))
      window.open(`/pdf/term-result?className=${className}&testNames=${termsJoined}`, '_blank')
      setIsSelectTermsOpen(false)
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
    setSubjectTotalMarks({})
    setSubjectsRequired([])
    setUploadedSubjects([])
    setIsMasterUploaded(false)
    setUploadMode('individual')
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>

        <CardHeader className="pb-6 pt-10 px-8 border-b border-border bg-background/20">
          <CardTitle className="flex items-center justify-between text-2xl font-black tracking-tight text-foreground">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              Term Result Wizard
            </div>
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            Upload marks subject by subject for a major term exam to generate a unified PDF result card.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 py-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">Select Term</Label>
                  <Select value={term} onValueChange={(val) => setTerm(val || '')}>
                    <SelectTrigger className="bg-background/40 border-border text-foreground h-12">
                      <SelectValue placeholder="E.g., First Term, Final Term" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Final Term">Final Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">Select Class</Label>
                  <Select value={selectedClass} onValueChange={(val) => {
                    const safeVal = val || ''
                    setSelectedClass(safeVal)
                    setSubjectsRequired(CLASS_SUBJECTS[safeVal] ? [...CLASS_SUBJECTS[safeVal]] : [])
                  }}>
                    <SelectTrigger className="bg-background/40 border-border text-foreground h-12">
                      <SelectValue placeholder="Choose Class (1-12)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground max-h-[300px]">
                      {CLASS_OPTIONS.map(c => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {subjectsRequired.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">Total Marks Per Subject</Label>
                    <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-primary/50 text-primary hover:bg-primary/20 h-8 px-3">
                          + Add Subject
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border text-foreground">
                        <DialogHeader>
                          <DialogTitle>Add Custom Subject</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="bg-transparent border-border" placeholder="e.g. Art" />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Marks</Label>
                            <Input type="number" value={newSubjectTotalMarks} onChange={(e) => setNewSubjectTotalMarks(e.target.value)} className="bg-transparent border-border" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsAddSubjectOpen(false)} className="text-muted-foreground">Cancel</Button>
                          <Button onClick={handleAddSubject} className="bg-primary text-black hover:bg-primary/90">Add Subject</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {subjectsRequired.map(subject => (
                      <div key={subject} className="space-y-2 relative group">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          {subject}
                          <button 
                            onClick={() => setSubjectsRequired(prev => prev.filter(s => s !== subject))} 
                            className="text-destructive/50 hover:text-destructive transition-colors"
                            title="Remove Subject"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Label>
                        <Input 
                          type="number" 
                          value={subjectTotalMarks[subject] || '100'} 
                          onChange={(e) => setSubjectTotalMarks(prev => ({ ...prev, [subject]: e.target.value }))}
                          className="bg-transparent border-border text-foreground h-10 pr-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
              
              <div className="flex gap-4 p-1 bg-card rounded-xl mb-6">
                <button 
                  onClick={() => setUploadMode('individual')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${uploadMode === 'individual' ? 'bg-primary text-black shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Upload by Subject
                </button>
                <button 
                  onClick={() => setUploadMode('master')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${uploadMode === 'master' ? 'bg-primary text-black shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Master Sheet (All Subjects)
                </button>
              </div>

              {uploadMode === 'master' ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-primary/10 border border-primary/20 p-4 rounded-xl text-primary gap-4">
                    <div>
                      <span className="font-bold text-lg block">Class {selectedClass} - {term}</span>
                      <span className="text-sm opacity-80">Master Upload for {subjectsRequired.length} subjects</span>
                    </div>
                    <Button onClick={downloadMasterTemplate} variant="outline" className="bg-transparent border-primary/50 hover:bg-primary/20 text-primary h-10">
                      <Download className="w-4 h-4 mr-2" />
                      Download Master Template
                    </Button>
                  </div>
                  
                  <div className="p-8 border-2 border-dashed border-border rounded-2xl bg-card flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleMasterFileUpload(file)
                      }}
                      disabled={isMasterUploading || isMasterUploaded}
                    />
                    
                    {isMasterUploading ? (
                      <div className="flex flex-col items-center gap-4 text-primary">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <span className="font-bold tracking-widest uppercase">Uploading Master Sheet...</span>
                      </div>
                    ) : isMasterUploaded ? (
                      <div className="flex flex-col items-center gap-4 text-primary">
                        <CheckCircle2 className="w-16 h-16" />
                        <div className="font-bold text-xl">Upload Complete!</div>
                        <Button 
                          variant="ghost" 
                          className="mt-2 text-muted-foreground hover:text-foreground relative z-20"
                          onClick={() => setIsMasterUploaded(false)}
                        >
                          Upload a different file
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-muted-foreground group-hover:text-primary transition-colors">
                        <UploadCloud className="w-16 h-16" />
                        <div>
                          <p className="font-bold text-lg text-foreground mb-1">Click or drag Master Sheet here</p>
                          <p className="text-sm">Supports .xlsx, .xls, .csv</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-primary/10 border border-primary/20 p-4 rounded-xl text-primary gap-4">
                    <div>
                      <span className="font-bold text-lg block">Class {selectedClass} - {term}</span>
                      <span className="text-sm opacity-80">{uploadedSubjects.length} of {subjectsRequired.length} subjects uploaded</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isFinished && (
                        <div className="flex items-center gap-2 font-bold bg-primary text-black px-4 h-10 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" /> All Uploaded!
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectsRequired.map(subject => {
                      const isUploaded = uploadedSubjects.includes(subject)
                      const isUploading = uploadingSubject === subject

                      return (
                        <div key={subject} className={`p-4 rounded-xl border transition-all ${isUploaded ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                              <BookOpen className="w-4 h-4 text-primary" />
                              {subject}
                              <span className="text-xs text-muted-foreground font-normal">({subjectTotalMarks[subject] || '100'} marks)</span>
                            </div>
                            {isUploaded && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
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
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="w-1/3 bg-transparent border-border hover:bg-card text-foreground h-10"
                                onClick={() => downloadSingleTemplate(subject)}
                                disabled={isUploading}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <div className="relative group w-2/3">
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
                                  className="w-full bg-card hover:bg-accent text-foreground border-none h-10"
                                  disabled={isUploading}
                                >
                                  {isUploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                  )}
                                  {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-foreground">Ready to Generate!</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  All {subjectsRequired.length} subjects for Class {selectedClass} have been successfully uploaded for {term}.
                </p>
              </div>
              <Button 
                onClick={openGenerateDialog}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90 text-black font-bold h-14 px-8 text-lg mt-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Calculator className="w-6 h-6 mr-3" />}
                {isGenerating ? 'Generating...' : 'Generate Term PDF'}
              </Button>

              <Dialog open={isSelectTermsOpen} onOpenChange={setIsSelectTermsOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Select Terms for Report Card</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select which terms you want to include on the Result Sheet. Selecting multiple terms will generate a Landscape side-by-side report card.
                    </p>
                    {isLoadingTerms ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : availableTerms.length === 0 ? (
                      <div className="text-center text-muted-foreground italic">No terms found for this class.</div>
                    ) : (
                      <div className="space-y-3 mt-4 border border-border rounded-xl p-4 bg-background/20">
                        {availableTerms.map(t => (
                          <div key={t} className="flex items-center space-x-3">
                            <Checkbox 
                              id={`term-${t}`}
                              checked={selectedTerms.includes(t)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTerms(prev => [...prev, t])
                                } else {
                                  setSelectedTerms(prev => prev.filter(x => x !== t))
                                }
                              }}
                              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                            />
                            <Label htmlFor={`term-${t}`} className="text-foreground cursor-pointer font-medium">{t}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSelectTermsOpen(false)} className="text-muted-foreground">Cancel</Button>
                    <Button onClick={handleProceedToPDF} disabled={selectedTerms.length === 0} className="bg-primary text-black hover:bg-primary/90 font-bold">
                      Proceed
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-8 py-6 border-t border-border bg-background/20 flex justify-between">
          <Button 
            variant="ghost" 
            onClick={resetWizard}
            className="text-muted-foreground hover:text-foreground hover:bg-card"
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
              className="bg-white text-black hover:bg-zinc-200 disabled:bg-card disabled:text-foreground/30"
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
