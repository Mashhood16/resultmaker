'use client'

import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Award, Star, Trophy, Medal } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

interface Student {
  name: string
  percentage: number
  rank: number
}

interface MonthlyCertificateProps {
  monthName: string
  className: string
  subjectName?: string
  topStudents: Student[]
}

export function MonthlyCertificate({ monthName, className, subjectName, topStudents }: MonthlyCertificateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!certRef.current) return
    setIsExporting(true)
    const toastId = toast.loading('Generating certificate image...')
    try {
      const dataUrl = await toPng(certRef.current, { 
        quality: 1.0, 
        pixelRatio: 3, // High res for whatsapp
        backgroundColor: '#09090b', // dark background
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      })
      const link = document.createElement('a')
      link.download = `Top_3_${className}_${monthName.replace(' ', '_')}.png`
      link.href = dataUrl
      link.click()
      toast.success('Certificate downloaded successfully!', { id: toastId })
    } catch (error: any) {
      toast.error(`Failed to export: ${error.message}`, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const first = topStudents.find(s => s.rank === 1) || topStudents[0]
  const second = topStudents.find(s => s.rank === 2) || topStudents[1]
  const third = topStudents.find(s => s.rank === 3) || topStudents[2]

  // Try to parse class and subject from URL if possible
  let displayClass = className;
  let displaySubject = subjectName;
  try {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'leaderboard') {
        if (parts[2]) displayClass = decodeURIComponent(parts[2]);
        if (parts[3]) displaySubject = decodeURIComponent(parts[3]);
      }
    }
  } catch (e) {}


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-amber-600/10 text-amber-500 border-amber-500/30 hover:bg-amber-600/20 shadow-sm whitespace-nowrap">
          <Award className="w-4 h-4 mr-2" />
          Export Monthly Top 3
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-card border-border shadow-2xl p-6 sm:p-8">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold">Monthly Stars Report</DialogTitle>
          <Button onClick={handleDownload} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Saving...' : 'Download Image'}
          </Button>
        </DialogHeader>
        
        <div className="flex justify-center mt-6 overflow-x-auto pb-4">
          {/* Certificate Container to capture */}
          <div 
            ref={certRef} 
            className="relative w-[800px] h-[500px] bg-gradient-to-br from-zinc-900 via-[#0a0a0c] to-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 shrink-0"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
            }}
          >
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col items-center text-center z-10 w-full mb-10">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 tracking-widest uppercase">
                  Stars of the Month
                </h2>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{monthName}</h1>
              <p className="text-xl text-zinc-400 font-medium tracking-wide">
                {className} {subjectName ? \`• \${subjectName}\` : ''}
              </p>
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-6 w-full z-10 px-12">
              {/* Silver */}
              {second && (
                <div className="flex flex-col items-center flex-1">
                  <div className="bg-zinc-800/60 border border-zinc-600/50 rounded-xl p-4 w-full text-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                    <div className="text-lg font-bold text-white truncate px-2">{second.name}</div>
                    <div className="text-zinc-400 font-bold mt-1">{second.percentage}%</div>
                  </div>
                  <div className="w-full h-32 bg-gradient-to-t from-zinc-800 to-zinc-700 rounded-t-lg border-t-4 border-zinc-400 flex flex-col items-center pt-4 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <Medal className="w-10 h-10 text-zinc-300 drop-shadow-md mb-2" />
                    <span className="text-3xl font-black text-zinc-400">2ND</span>
                  </div>
                </div>
              )}

              {/* Gold */}
              {first && (
                <div className="flex flex-col items-center flex-1">
                  <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-5 w-full text-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.15)] backdrop-blur-sm relative transform -translate-y-4">
                    <Trophy className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    <div className="text-2xl font-black text-white truncate px-2 mt-4">{first.name}</div>
                    <div className="text-yellow-400 font-bold mt-1 text-lg">{first.percentage}%</div>
                  </div>
                  <div className="w-full h-44 bg-gradient-to-t from-yellow-900/80 to-yellow-600/60 rounded-t-lg border-t-4 border-yellow-400 flex flex-col items-center pt-6 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <span className="text-5xl font-black text-yellow-300 drop-shadow-lg">1ST</span>
                  </div>
                </div>
              )}

              {/* Bronze */}
              {third && (
                <div className="flex flex-col items-center flex-1">
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 w-full text-center mb-4 shadow-[0_0_20px_rgba(249,115,22,0.1)] backdrop-blur-sm">
                    <div className="text-lg font-bold text-white truncate px-2">{third.name}</div>
                    <div className="text-orange-400 font-bold mt-1">{third.percentage}%</div>
                  </div>
                  <div className="w-full h-24 bg-gradient-to-t from-orange-950 to-orange-800 rounded-t-lg border-t-4 border-orange-600 flex flex-col items-center pt-3 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <Medal className="w-8 h-8 text-orange-400 drop-shadow-md mb-1" />
                    <span className="text-2xl font-black text-orange-400">3RD</span>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 right-6 text-zinc-600 text-xs font-bold tracking-widest uppercase">
              Generated by ResultMaker
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
