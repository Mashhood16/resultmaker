'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookOpen, Upload, Loader2, FileSpreadsheet } from 'lucide-react'
import { uploadCopyCheckingAction } from '../copy-actions'
import { toast } from 'sonner'
import { Class } from '@prisma/client'

export function CopyCheckingForm({ classes }: { classes: Class[] }) {
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)

    const formData = new FormData(e.currentTarget)
    const res = await uploadCopyCheckingAction(formData)

    if (res.success) {
      toast.success(res.message)
      ;(e.target as HTMLFormElement).reset()
    } else {
      toast.error(res.error)
    }
    
    setIsUploading(false)
  }

  return (
    <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />
      
      <CardHeader className="pb-4 pt-8 px-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
            <BookOpen className="w-6 h-6 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"/> 
          </div>
          Copy / Notebook Checking Status
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm mt-2 leading-relaxed">
          Upload an Excel sheet containing Roll Number, Name, and Status (C for Complete, I for Incomplete). 
          This will automatically queue WhatsApp messages to their parents.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="className" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Class / Grade</Label>
              <select 
                id="className" 
                name="className" 
                required
                className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-accent/20"
              >
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Subject Name</Label>
              <Input 
                id="subjectName" 
                name="subjectName" 
                placeholder="e.g. English, Math..." 
                required 
                className="h-12 bg-background/50 border-input rounded-xl hover:bg-accent/20 transition-all focus:bg-background" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkDate" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Date of Checking</Label>
              <Input 
                id="checkDate" 
                name="checkDate" 
                type="date" 
                required 
                className="h-12 bg-background/50 border-input rounded-xl hover:bg-accent/20 transition-all focus:bg-background" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Excel File (.xlsx / .csv)</Label>
              <div className="relative group">
                <Input 
                  id="file" 
                  name="file" 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  required 
                  className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500/10 file:text-teal-500 hover:file:bg-teal-500/20 bg-background/50 border-input rounded-xl hover:bg-accent/20 transition-all cursor-pointer" 
                />
                <FileSpreadsheet className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-teal-500 transition-colors" />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
          >
            {isUploading ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Processing & Queuing Messages...</>
            ) : (
              <><Upload className="w-5 h-5 mr-3" /> Upload Status & Queue Messages</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
