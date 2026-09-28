'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UploadCloud, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createMaterial, deleteMaterial } from './actions'

export function MaterialsClient({ 
  classes, 
  subjects, 
  subjectAccess,
  existingMaterials 
}: { 
  classes: any[], 
  subjects: any[], 
  subjectAccess: any,
  existingMaterials: any[] 
}) {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('general')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const allowedSubjectsForClass = selectedClass && subjectAccess[selectedClass] 
    ? subjects.filter(s => subjectAccess[selectedClass].includes(s.id))
    : []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      // Increased limit to 100MB
      if (selected.size > 100 * 1024 * 1024) {
        toast.error('File size must be under 100MB')
        return
      }
      setFile(selected)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedClass || !title) {
      toast.error('Please fill all required fields and attach a file')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Uploading large file to cloud... This may take a moment.')

    try {
      // 1. Get secure signature from our backend
      const signRes = await fetch('/api/cloudinary-sign')
      const signData = await signRes.json()
      
      if (!signRes.ok) throw new Error(signData.error || 'Failed to get upload signature')

      // 2. Upload directly to Cloudinary bypassing Vercel limits
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signData.apiKey)
      formData.append('timestamp', signData.timestamp)
      formData.append('signature', signData.signature)
      formData.append('folder', signData.folder)
      
      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      })

      const cloudinaryData = await cloudinaryRes.json()
      if (!cloudinaryRes.ok) throw new Error(cloudinaryData.error?.message || 'Failed to upload to cloud storage')

      // 3. Save the secure URL to our database
      await createMaterial({
        title,
        description,
        fileUrl: cloudinaryData.secure_url,
        fileType: file.type || 'application/octet-stream',
        classId: selectedClass,
        subjectId: selectedSubject === 'general' ? undefined : selectedSubject
      })

      toast.success('Material uploaded successfully!', { id: toastId })
      setTitle('')
      setDescription('')
      setFile(null)
      // Reset file input visually
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      await deleteMaterial(id)
      toast.success('Deleted successfully')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card border-border shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardHeader>
          <CardTitle>Upload Study Material</CardTitle>
          <CardDescription>Upload textbooks, notes, or past papers (Up to 100MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject('general') }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject (Optional)</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">-- General Class Material --</SelectItem>
                    {allowedSubjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Physics Chapter 1 Notes" />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the contents..." />
            </div>

            <div className="space-y-2">
              <Label>File Attachment (Max 100MB)</Label>
              <Input id="file-upload" type="file" required onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar" className="cursor-pointer" />
            </div>

            <Button type="submit" disabled={isUploading || !file || !selectedClass} className="w-full">
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              Upload Material
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Your Uploaded Materials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingMaterials.map(mat => (
            <Card key={mat.id} className="bg-card/50 border-border">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <FileText className="w-5 h-5 shrink-0" />
                      <span className="font-bold line-clamp-1">{mat.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => handleDelete(mat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {mat.class.name} {mat.subject ? `• ${mat.subject.name}` : '• General'}
                  </p>
                  {mat.description && <p className="text-sm text-foreground line-clamp-2">{mat.description}</p>}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                    View File
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
          {existingMaterials.length === 0 && (
            <p className="text-muted-foreground italic col-span-full">No materials uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
