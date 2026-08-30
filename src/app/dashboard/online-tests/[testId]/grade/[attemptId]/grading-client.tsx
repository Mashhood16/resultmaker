'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, PenTool, Eraser, Loader2 } from 'lucide-react'
import { submitGrade } from '../grade-actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'
import html2canvas from 'html2canvas'

export default function GradingClient({ attempt, test, variant, student }: any) {
  const router = useRouter()
  const [marks, setMarks] = useState<string>(attempt.obtainedMarks?.toString() || '')
  const [feedback, setFeedback] = useState(attempt.feedback || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEraser, setIsEraser] = useState(false)
  
  // States for rendering the document to image
  const [backgroundImage, setBackgroundImage] = useState<string | null>(attempt.annotatedImage || null)
  const [isRendering, setIsRendering] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<ReactSketchCanvasRef>(null)

  // Turn the HTML into an image for annotation if not already annotated
  useEffect(() => {
    if (!backgroundImage && contentRef.current) {
      setIsRendering(true)
      // Give it a small delay to ensure fonts/katex load
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(contentRef.current!)
          setBackgroundImage(canvas.toDataURL('image/png'))
        } catch (e) {
          console.error("Failed to render document snapshot", e)
          toast.error("Failed to load document for grading")
        } finally {
          setIsRendering(false)
        }
      }, 1000)
    }
  }, [backgroundImage])

  const toggleEraser = () => {
    setIsEraser(!isEraser)
    canvasRef.current?.eraseMode(!isEraser)
  }

  const handleSave = async () => {
    if (!marks || parseFloat(marks) < 0 || parseFloat(marks) > test.totalMarks) {
      toast.error(`Marks must be between 0 and ${test.totalMarks}`)
      return
    }

    setIsSubmitting(true)
    let finalImageUrl = backgroundImage

    // If they made annotations on the canvas, upload it
    if (canvasRef.current) {
      try {
        const exportedImage = await canvasRef.current.exportImage("png")
        
        // Upload to Cloudinary via our API route
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: exportedImage })
        })
        
        if (res.ok) {
          const data = await res.json()
          finalImageUrl = data.url
        } else {
          toast.error("Failed to upload annotated image, saving without it.")
        }
      } catch (e) {
        console.error("Canvas export/upload failed", e)
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
      toast.success('Grade saved & leaderboard updated!')
      router.push(`/dashboard/online-tests/${test.id}/grade`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save grade')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/online-tests/${test.id}/grade`}>
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
          </Button>
        </Link>
        <div className="flex items-center gap-4">
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
                <CardTitle>{student.name}'s Submission</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Variant: {variant.name}</p>
              </div>
              <div className="flex gap-2 bg-muted p-1 rounded-lg">
                <Button 
                  variant={!isEraser ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => { setIsEraser(false); canvasRef.current?.eraseMode(false) }}
                >
                  <PenTool className="w-4 h-4 mr-2" /> Red Pen
                </Button>
                <Button 
                  variant={isEraser ? "default" : "ghost"} 
                  size="sm" 
                  onClick={toggleEraser}
                >
                  <Eraser className="w-4 h-4 mr-2" /> Eraser
                </Button>
                <Button variant="ghost" size="sm" onClick={() => canvasRef.current?.clearCanvas()}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isRendering && (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Rendering document for grading...</p>
                </div>
              )}
              
              <div className={`relative border rounded-xl overflow-hidden bg-white min-h-[800px] ${isRendering ? 'hidden' : ''}`}>
                {backgroundImage ? (
                  <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={4}
                    strokeColor="red"
                    backgroundImage={backgroundImage}
                    className="w-full h-full"
                    preserveBackgroundImageAspectRatio="xMidYMid meet"
                  />
                ) : (
                  // We render the HTML here invisibly to take a snapshot, or visibly if snapshot fails
                  <div ref={contentRef} className="p-8 prose prose-sm md:prose-base max-w-none text-black bg-white">
                    <div dangerouslySetInnerHTML={{ __html: attempt.answers || '<p>No answers provided.</p>' }} />
                  </div>
                )}
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
