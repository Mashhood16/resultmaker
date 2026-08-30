'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, ArrowRight, ArrowLeft } from 'lucide-react'
import { createOnlineTest } from '../test-wizard-actions'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// ReactQuill must be loaded dynamically since it requires the browser (window)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'

export default function TestWizardClient({
  classes,
  allSubjects,
  teacherSubjectAccess,
  isTeacher
}: {
  classes: any[]
  allSubjects: any[]
  teacherSubjectAccess: any[]
  isTeacher: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Test Details
  const [title, setTitle] = useState('')
  const [testName, setTestName] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  // Step 2: Variants
  const [variants, setVariants] = useState([{ id: 1, name: 'Variant A', accessPin: '', content: '' }])

  // Derive available subjects based on selected class
  let availableSubjects = allSubjects
  if (isTeacher && classId) {
    const allowedSubjectIds = teacherSubjectAccess
      .filter(a => a.classId === classId)
      .map(a => a.subjectId)
    availableSubjects = allSubjects.filter(s => allowedSubjectIds.includes(s.id))
  }

  const addVariant = () => {
    const nextId = Math.max(...variants.map(v => v.id)) + 1
    const nextLetter = String.fromCharCode(65 + variants.length) // A, B, C...
    setVariants([...variants, { id: nextId, name: `Variant ${nextLetter}`, accessPin: '', content: '' }])
  }

  const updateVariant = (id: number, field: string, value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const removeVariant = (id: number) => {
    if (variants.length === 1) return
    setVariants(variants.filter(v => v.id !== id))
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['formula'],
      ['clean']
    ],
  }

  const handleNext = () => {
    if (!title || !testName || !totalMarks || !classId || !subjectId) {
      toast.error('Please fill in all test details')
      return
    }
    setStep(2)
  }

  const handleSave = async () => {
    if (variants.some(v => !v.accessPin || !v.content)) {
      toast.error('Please provide a PIN and content for all variants')
      return
    }
    
    setLoading(true)
    try {
      await createOnlineTest({
        title,
        testName,
        totalMarks: parseFloat(totalMarks),
        classId,
        subjectId,
        variants: variants.map(v => ({
          name: v.name,
          accessPin: v.accessPin,
          content: v.content
        }))
      })
      toast.success('Online Test created successfully!')
      router.push('/dashboard/online-tests')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create test')
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Test Title (Visible to students)</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Midterm Exam" />
          </div>
          <div className="space-y-2">
            <Label>Internal Test Name (Used for leaderboard syncing)</Label>
            <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g., Midterm" />
          </div>
          <div className="space-y-2">
            <Label>Total Marks</Label>
            <Input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} placeholder="100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={(val) => { setClassId(val); setSubjectId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class">
                    {classes.find(c => c.id === classId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject">
                    {availableSubjects.find(s => s.id === subjectId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleNext}>
            Next Step <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Details
        </Button>
        <Button onClick={handleSave} disabled={loading} className="px-8 shadow-md">
          {loading ? 'Saving...' : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Test & Activate
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {variants.map((variant, index) => (
          <Card key={variant.id} className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                {variant.name}
              </CardTitle>
              {variants.length > 1 && (
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeVariant(variant.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input value={variant.name} onChange={e => updateVariant(variant.id, 'name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Access PIN (e.g., 1234)</Label>
                  <Input value={variant.accessPin} onChange={e => updateVariant(variant.id, 'accessPin', e.target.value)} placeholder="Students enter this to unlock" />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Questions Content</Label>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                    onClick={async () => {
                      const topic = prompt('Enter a topic for AI test generation (e.g., Photosynthesis):')
                      if (!topic) return
                      
                      const toastId = toast.loading('Generating questions with AI...')
                      try {
                        const res = await fetch('/api/ai/generate-test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ topic, numQuestions: 5, difficulty: 'medium' })
                        })
                        const data = await res.json()
                        if (res.ok) {
                          updateVariant(variant.id, 'content', variant.content + '<br/>' + data.html)
                          toast.success('AI generation complete!', { id: toastId })
                        } else {
                          throw new Error(data.error)
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to generate', { id: toastId })
                      }
                    }}
                  >
                    ✨ Generate with AI
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden bg-background h-auto">
                  <ReactQuill 
                    theme="snow" 
                    value={variant.content} 
                    onChange={(val) => updateVariant(variant.id, 'content', val)} 
                    modules={modules}
                    className="h-64 mb-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addVariant} className="w-full border-dashed h-12 text-muted-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Another Variant
        </Button>
      </div>
    </div>
  )
}
