'use client'

import { useState, useRef } from 'react'
import { uploadContactsAction } from './student-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { UploadCloud, Phone, Loader2 } from 'lucide-react'

export function UploadContactsForm({ classes }: { classes: { id: string, name: string }[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file to upload.')
      return
    }
    if (!selectedClass) {
      toast.error('Please select a class.')
      return
    }
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadContactsAction(formData, selectedClass)
      if (res.success) {
        toast.success(res.message)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute -inset-4 bg-gradient-to-tr from-green-600/20 via-emerald-500/20 to-transparent blur-3xl rounded-[3rem] -z-10" />
      
      <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400" />
        
        <CardHeader className="pb-4 pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <Phone className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"/> 
            </div>
            Upload Contacts
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            Upload an Excel sheet with Name, Roll Number, and Contact Number columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="className" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-transparent border-border text-foreground focus-visible:ring-green-500/50 focus-visible:border-green-500 transition-all rounded-xl h-12 px-4 shadow-inner">
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground max-h-60">
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2 mt-6">
                <Label className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Spreadsheet File</Label>
              </div>
              <div 
                className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-card hover:border-green-400/50 transition-all duration-300 cursor-pointer relative group overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-3 bg-card rounded-full mb-3 group-hover:scale-110 group-hover:bg-green-500/10 transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-green-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-center z-10 text-muted-foreground group-hover:text-foreground transition-colors">
                  {file ? <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">{file.name}</span> : 'Click to Browse'}
                </span>
                <input 
                  type="file" 
                  accept=".xlsx,.csv,.xls" 
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
  
            <div className="pt-4">
              <Button type="submit" disabled={isUploading} className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-foreground shadow-lg shadow-green-500/20 border-0 rounded-xl h-12 text-md font-bold transition-all duration-300 hover:shadow-green-500/40 hover:scale-[1.02]">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isUploading ? 'Uploading Contacts...' : 'Upload Contacts'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
