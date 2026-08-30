'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Square, Circle, Type, Undo2, Trash2, Pen } from 'lucide-react'
import { submitGrade } from '../grade-actions'
import { toast } from 'sonner'
import Link from 'next/link'
import html2canvas from 'html2canvas'

type Point = { x: number, y: number }
type Annotation = 
  | { id: string, type: 'square', start: Point, end: Point }
  | { id: string, type: 'circle', start: Point, end: Point }
  | { id: string, type: 'text', start: Point, text: string, isEditing: boolean }
  | { id: string, type: 'pen', points: Point[] }

type Tool = 'pen' | 'square' | 'circle' | 'text' | 'none'

export default function GradingClient({ attempt, test, variant, student }: any) {
  const router = useRouter()
  const [marks, setMarks] = useState<string>(attempt.obtainedMarks?.toString() || '')
  const [feedback, setFeedback] = useState(attempt.feedback || '')
  const [rubric, setRubric] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)

  // Annotation State
  const [tool, setTool] = useState<Tool>('square')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const getCoordinates = (e: React.PointerEvent<HTMLDivElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'none') return
    
    // Don't start drawing if clicking on an input (editing text)
    if ((e.target as HTMLElement).tagName === 'INPUT') return

    const pt = getCoordinates(e)
    
    if (tool === 'text') {
      // Defer creating text box to pointerUp to prevent instant blur
      return
    }

    setIsDrawing(true)
    if (tool === 'pen') {
      setCurrentDrawing({ id: Date.now().toString(), type: 'pen', points: [pt] })
    } else {
      setCurrentDrawing({ id: Date.now().toString(), type: tool, start: pt, end: pt } as Annotation)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentDrawing || currentDrawing.type === 'text') return
    const pt = getCoordinates(e)
    
    if (currentDrawing.type === 'pen') {
      setCurrentDrawing({ ...currentDrawing, points: [...currentDrawing.points, pt] })
    } else {
      setCurrentDrawing({ ...currentDrawing, end: pt })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'text') {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const pt = getCoordinates(e)
      const newId = Date.now().toString()
      setAnnotations([...annotations, { id: newId, type: 'text', start: pt, text: '', isEditing: true }])
      setTool('none') // Default back to none so they don't accidentally make 10 text boxes
      return
    }

    if (isDrawing && currentDrawing) {
      if (currentDrawing.type === 'pen') {
        if (currentDrawing.points.length > 1) {
          setAnnotations([...annotations, currentDrawing])
        }
      } else if (currentDrawing.type !== 'text') {
        const w = Math.abs(currentDrawing.end.x - currentDrawing.start.x)
        const h = Math.abs(currentDrawing.end.y - currentDrawing.start.y)
        if (w > 5 || h > 5) {
          setAnnotations([...annotations, currentDrawing])
        }
      }
      setCurrentDrawing(null)
      setIsDrawing(false)
    }
  }

  const updateText = (id: string, text: string) => {
    setAnnotations(annotations.map(a => a.id === id && a.type === 'text' ? { ...a, text } : a))
  }

  const finishText = (id: string) => {
    setAnnotations(annotations.map(a => a.id === id && a.type === 'text' ? { ...a, isEditing: false } : a))
    // Clean up empty texts
    setAnnotations(prev => prev.filter(a => !(a.type === 'text' && !a.isEditing && a.text.trim() === '')))
    setTool('square') // Switch back to default tool
  }

  const undo = () => {
    setAnnotations(annotations.slice(0, -1))
  }

  const clearAll = () => {
    setAnnotations([])
  }

  const renderShape = (a: Annotation) => {
    if (a.type === 'pen') {
      const points = a.points.map(p => `${p.x},${p.y}`).join(' ')
      return <polyline key={a.id} points={points} fill="none" stroke="red" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    }
    if (a.type === 'square') {
      const x = Math.min(a.start.x, a.end.x)
      const y = Math.min(a.start.y, a.end.y)
      const w = Math.abs(a.end.x - a.start.x)
      const h = Math.abs(a.end.y - a.start.y)
      return <rect key={a.id} x={x} y={y} width={w} height={h} fill="none" stroke="red" strokeWidth={4} rx={4} />
    }
    if (a.type === 'circle') {
      const x = Math.min(a.start.x, a.end.x)
      const y = Math.min(a.start.y, a.end.y)
      const w = Math.abs(a.end.x - a.start.x)
      const h = Math.abs(a.end.y - a.start.y)
      return <ellipse key={a.id} cx={x + w/2} cy={y + h/2} rx={w/2} ry={h/2} fill="none" stroke="red" strokeWidth={4} />
    }
    return null
  }

  const handleSave = async () => {
    if (!marks || parseFloat(marks) < 0 || parseFloat(marks) > test.totalMarks) {
      toast.error(`Marks must be between 0 and ${test.totalMarks}`)
      return
    }

    // Force finish any active text editing
    setAnnotations(prev => prev.map(a => a.type === 'text' ? { ...a, isEditing: false } : a).filter(a => !(a.type === 'text' && a.text.trim() === '')))

    setIsSubmitting(true)
    let finalImageUrl = attempt.annotatedImage

    if (contentRef.current && annotations.length > 0) {
      try {
        const canvas = await html2canvas(contentRef.current, { useCORS: true, allowTaint: true })
        const exportedImage = canvas.toDataURL('image/png')
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: exportedImage })
        })
        const data = await res.json()
        if (data.url) finalImageUrl = data.url
      } catch (err) {
        toast.error('Failed to save annotated image. Proceeding with original.')
      }
    }

    try {
      await submitGrade({
        attemptId: attempt.id,
        testId: test.id,
        obtainedMarks: parseFloat(marks),
        feedback,
        annotatedImage: finalImageUrl || undefined
      })
      toast.success('Grade submitted successfully')
      router.push(`/dashboard/online-tests/${test.id}/grade`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit grade')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/online-tests/${test.id}/grade`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Grade Submission</h1>
            <p className="text-sm text-muted-foreground">{test.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <Label>Grading Rubric / Answer Key (Optional)</Label>
            <Textarea 
              placeholder="e.g. 5 marks for correct formula, 5 marks for final answer..." 
              value={rubric} 
              onChange={e => setRubric(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <Button 
            variant="secondary" 
            className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shadow-none border-0 mt-auto mb-1"
            onClick={async () => {
              const toastId = toast.loading('AI is reviewing submission...')
              try {
                const res = await fetch('/api/ai/grade-submission', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    imageUrl: attempt.annotatedImage || undefined,
                    textAnswers: !attempt.annotatedImage ? attempt.answers : undefined,
                    totalMarks: test.totalMarks,
                    testTitle: test.title,
                    rubric: rubric
                  })
                })
                const data = await res.json()
                if (res.ok) {
                  setMarks(data.obtainedMarks?.toString() || '')
                  setFeedback(data.feedback || '')
                  toast.success('AI grading complete! Please review.', { id: toastId })
                } else {
                  throw new Error(data.error)
                }
              } catch (err: any) {
                toast.error(err.message || 'AI grading failed', { id: toastId })
              }
            }}
          >
            ✨ Auto-Grade with AI
          </Button>
          <div className="flex items-center gap-2">
            <Label>Marks:</Label>
            <Input 
              type="number" 
              value={marks} 
              onChange={e => setMarks(e.target.value)} 
              className="w-24 text-lg font-bold text-primary"
              placeholder={`/ ${test.totalMarks}`}
            />
          </div>
          <Button onClick={handleSave} disabled={isSubmitting} className="shadow-lg">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Submit Grade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{student.name}'s Submission (Roll: {student.rollNumber})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Variant: {variant.name}</p>
              </div>
              <div className="flex gap-2 bg-muted p-1 rounded-lg">
                <Button variant={tool === 'pen' ? "default" : "ghost"} size="sm" onClick={() => setTool('pen')}>
                  <Pen className="w-4 h-4" />
                </Button>
                <Button variant={tool === 'square' ? "default" : "ghost"} size="sm" onClick={() => setTool('square')}>
                  <Square className="w-4 h-4" />
                </Button>
                <Button variant={tool === 'circle' ? "default" : "ghost"} size="sm" onClick={() => setTool('circle')}>
                  <Circle className="w-4 h-4" />
                </Button>
                <Button variant={tool === 'text' ? "default" : "ghost"} size="sm" onClick={() => setTool('text')}>
                  <Type className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 self-center" />
                <Button variant="ghost" size="sm" onClick={undo} disabled={annotations.length === 0}>
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={clearAll} disabled={annotations.length === 0}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={contentRef} 
                className="relative border rounded-xl overflow-hidden bg-white min-h-[800px] h-auto select-none"
              >
                {attempt.annotatedImage ? (
                  <img src={attempt.annotatedImage} alt="Graded Snapshot" className="w-full h-auto block pointer-events-none" crossOrigin="anonymous" />
                ) : (
                  <div className="p-8 prose prose-sm md:prose-base max-w-none text-black pointer-events-none">
                    <div dangerouslySetInnerHTML={{ __html: attempt.answers || '<p>No answers provided.</p>' }} />
                  </div>
                )}
                
                {/* The Custom Annotation Overlay */}
                <div 
                  className="absolute inset-0 z-10"
                  style={{
                    cursor: tool !== 'none' ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M9 0v9H0v2h9v9h2v-9h9V9h-9V0H9z" fill="%23ef4444"/></svg>') 10 10, crosshair` : 'default'
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {/* SVG Layer for Shapes */}
                  <svg className="w-full h-full pointer-events-none">
                    {annotations.map(renderShape)}
                    {currentDrawing && renderShape(currentDrawing)}
                  </svg>
                  
                  {/* HTML Layer for Text */}
                  {annotations.filter(a => a.type === 'text').map(a => (
                    a.type === 'text' && (
                      <div key={a.id} style={{ position: 'absolute', left: a.start.x, top: a.start.y }} className="pointer-events-auto">
                        {a.isEditing ? (
                          <input 
                            autoFocus
                            className="bg-white/80 border border-red-500 text-red-600 font-bold px-2 py-1 outline-none rounded shadow-sm text-lg min-w-[200px]"
                            value={a.text}
                            onChange={e => updateText(a.id, e.target.value)}
                            onBlur={() => finishText(a.id)}
                            onKeyDown={e => { if (e.key === 'Enter') finishText(a.id) }}
                            placeholder="Type annotation..."
                          />
                        ) : (
                          <div className="text-red-600 font-bold whitespace-pre-wrap text-lg bg-white/60 px-1 rounded inline-block border border-transparent hover:border-red-300 cursor-pointer" onClick={() => {
                            setAnnotations(annotations.map(ann => ann.id === a.id && ann.type === 'text' ? { ...ann, isEditing: true } : ann))
                            setTool('none')
                          }}>
                            {a.text}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grading Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Score</Label>
                <div className="text-4xl font-black text-primary">
                  {marks || '0'} <span className="text-2xl text-muted-foreground">/ {test.totalMarks}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Percentage</Label>
                <div className="text-xl font-bold text-foreground">
                  {marks ? ((parseFloat(marks) / test.totalMarks) * 100).toFixed(1) : '0'}%
                </div>
              </div>
              <div className="space-y-2">
                <Label>Feedback Remarks (Optional)</Label>
                <Textarea 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)} 
                  placeholder="Great job on question 3..."
                  className="min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
