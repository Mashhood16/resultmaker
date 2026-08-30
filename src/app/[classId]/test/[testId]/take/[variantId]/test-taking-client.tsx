'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PenTool, Save, Send } from 'lucide-react'
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
  
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const quillRef = useRef<any>(null)

  // Autosave every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (answers) {
        setIsSaving(true)
        await autosaveAttempt(attempt.id, answers)
        setIsSaving(false)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [answers, attempt.id])

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit your final answers? You cannot edit them later.')) return
    
    setIsSubmitting(true)
    try {
      await submitAttempt(attempt.id, answers)
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
      
      // We manually insert the image into the quill editor at the current selection
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg">{test.title}</h1>
          <p className="text-xs text-muted-foreground">Total Marks: {test.totalMarks}</p>
        </div>
        <div className="flex items-center gap-4">
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
            {isSubmitting ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" /> Submit Test</>}
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
