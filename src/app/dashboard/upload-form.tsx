'use client'

import { useState } from 'react'
import { uploadMarksAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { UploadCloud, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-lg shadow-blue-500/20 border-0 rounded-xl h-12 text-md font-bold transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02]">
      {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
      {pending ? 'Processing...' : 'Secure Upload'}
    </Button>
  )
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)

  async function action(formData: FormData) {
    if (!file) {
      toast.error('Please select a file to upload.')
      return
    }
    const res = await uploadMarksAction(formData)
    if (res.success) {
      toast.success(res.message)
      setFile(null)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Glowing background behind form */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-emerald-500/20 to-transparent blur-3xl rounded-[3rem] -z-10" />
      
      <Card className="w-full bg-white/5 border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400" />
        
        <CardHeader className="pb-4 pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-white">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <FileSpreadsheet className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"/> 
            </div>
            Import Data
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-2">
            Upload Excel (.xlsx) or CSV files to instantly update the real-time leaderboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form action={action} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="className" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">Class Name</Label>
              <Input id="className" name="className" placeholder="e.g. Grade 10" required className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all rounded-xl h-12 px-4 shadow-inner" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">Subject Name</Label>
              <Input id="subjectName" name="subjectName" placeholder="e.g. Mathematics" required className="bg-black/40 border-white/10 text-white focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all rounded-xl h-12 px-4 shadow-inner" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testName" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">Test Name</Label>
              <Input id="testName" name="testName" placeholder="e.g. Week 1, Midterms" required className="bg-black/40 border-white/10 text-white focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all rounded-xl h-12 px-4 shadow-inner" />
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2 mt-6">
                <Label className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">Spreadsheet File</Label>
                <a href="/sample_format.xlsx" download className="text-emerald-400/80 hover:text-emerald-400 text-xs flex items-center gap-1 transition-colors hover:underline">
                  <Download className="w-3 h-3" />
                  Download Example Format
                </a>
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:bg-white/5 hover:border-blue-400/50 transition-all duration-300 cursor-pointer relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300">
                  <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-center z-10 text-zinc-400 group-hover:text-white transition-colors">
                  {file ? <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{file.name}</span> : 'Drag & Drop or Click to Browse'}
                </span>
                <input 
                  type="file" 
                  name="file" 
                  accept=".xlsx,.csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </div>
  
            <div className="pt-4">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
