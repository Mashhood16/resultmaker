'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PenTool, Save, Send, AlertTriangle, Maximize } from 'lucide-react'
import { autosaveAttempt, submitAttempt } from './test-actions'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'
import katex from 'katex'

// Make katex available globally for quill
if (typeof window !== 'undefined') {
  (window as any).katex = katex
}

export default function TestTakingClient({ 
  attempt, 
  test, 
  variant 
}: { 
  attempt: any, 
  test: any, 
  variant: any 
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState(attempt.answers || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  
  const [hasStarted, setHasStarted] = useState(false)
  const [warnings, setWarnings] = useState(0)
  
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const quillRef = useRef<any>(null)

  // Autosave every 10 seconds
  useEffect(() => {
    if (!hasStarted) return
    const interval = setInterval(async () => {
      if (answers) {
        setIsSaving(true)
        await autosaveAttempt(attempt.id, answers)
        setIsSaving(false)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [answers, attempt.id, hasStarted])

  // Anti-Cheat: Visibility Change & BeforeUnload
  useEffect(() => {
    if (!hasStarted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => {
          const newWarnings = prev + 1
          toast.error(`Warning ${newWarnings}/2: Do not leave the test tab! Your test will be auto-submitted if you continue.`, { duration: 5000 })
          
          if (newWarnings >= 2) {
            // Auto submit
            submitAttempt(attempt.id, answers + '<br><br><b>[AUTO-SUBMITTED DUE TO TAB SWITCHING VIOLATION]</b>')
              .then(() => {
                alert('Test auto-submitted due to multiple tab switching violations.')
                router.refresh()
              })
          }
          return newWarnings
        })
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasStarted, answers, attempt.id, router])

  const startTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn("Fullscreen API failed", err)
    }
    setHasStarted(true)
  }

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to finish the test? You cannot edit your answers later.')) return
    
    setIsSubmitting(true)
    try {
      await submitAttempt(attempt.id, answers)
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen()
      }
      toast.success('Test submitted successfully!')
      router.refresh()
    } catch (e) {
      toast.error('Failed to submit test')
      setIsSubmitting(false)
    }
  }

  const handleSaveDrawing = async () => {
    if (canvasRef.current) {
      const dataUri = await canvasRef.current.exportImage("png")
      const imgHtml = `<img src="${dataUri}" alt="Drawn Diagram" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" />`
      setAnswers((prev: string) => prev + '<br/>' + imgHtml + '<br/>')
      setIsDrawing(false)
    }
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

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg border-destructive shadow-2xl">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Ready to begin?</h1>
            <div className="text-muted-foreground space-y-2 text-sm text-left bg-muted p-4 rounded-lg">
              <p><strong>Rules:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>This test requires Fullscreen mode.</li>
                <li>Do not change tabs, minimize the browser, or open other windows.</li>
                <li>If you leave the test tab 2 times, your test will be <strong>auto-submitted</strong>.</li>
                <li>Do not close the browser until you click "Finish Test".</li>
              </ul>
            </div>
            <Button onClick={startTest} className="w-full h-14 text-lg font-bold">
              <Maximize className="w-5 h-5 mr-2" /> Enter Fullscreen & Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg">{test.title}</h1>
          <p className="text-xs text-muted-foreground">Total Marks: {test.totalMarks}</p>
        </div>
        <div className="flex items-center gap-4">
          {warnings > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full animate-pulse">
              Warnings: {warnings}/2
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {isSaving ? (
              <><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> Saving...</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-green-500" /> Saved</>
            )}
          </span>
          <Button onClick={() => setIsDrawing(true)} variant="secondary" size="sm">
            <PenTool className="w-4 h-4 mr-2" /> Draw
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {isSubmitting ? 'Finishing...' : <><Send className="w-4 h-4 mr-2" /> Finish Test</>}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Questions */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-border bg-muted/20">
          <h2 className="text-xl font-bold mb-6 pb-2 border-b">Questions ({variant.name})</h2>
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: variant.content }} />
        </div>

        {/* Right Side: Answers Editor */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-card">
          <div className="flex-1 overflow-y-auto">
            <ReactQuill 
              ref={quillRef}
              theme="snow" 
              value={answers} 
              onChange={setAnswers} 
              modules={modules}
              className="h-full border-none [&>.ql-container]:border-none [&>.ql-container]:text-base [&>.ql-toolbar]:border-none [&>.ql-toolbar]:border-b [&>.ql-toolbar]:bg-muted/50"
              placeholder="Write your answers here..."
            />
          </div>
        </div>
      </main>

      {/* Drawing Modal */}
      <Dialog open={isDrawing} onOpenChange={setIsDrawing}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Draw Diagram</DialogTitle>
          </DialogHeader>
          <div className="flex-1 border rounded-xl overflow-hidden bg-white">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={3}
              strokeColor="black"
              canvasColor="white"
              className="w-full h-full"
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={() => canvasRef.current?.clearCanvas()}>Clear Canvas</Button>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => setIsDrawing(false)}>Cancel</Button>
              <Button onClick={handleSaveDrawing}><Save className="w-4 h-4 mr-2"/> Insert into Answer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
