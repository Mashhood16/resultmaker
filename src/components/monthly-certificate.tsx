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
  buttonLabel?: React.ReactNode
}

export function MonthlyCertificate({ monthName, className, subjectName, topStudents, buttonLabel }: MonthlyCertificateProps) {
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
      // The path might be something like /dashboard/leaderboard/[class]/[subject]
      // or /leaderboard/[class]/[subject]
      const classIdx = parts.indexOf('leaderboard') + 1;
      if (classIdx > 0 && classIdx < parts.length) {
         if (parts[classIdx]) {
           const parsedClass = decodeURIComponent(parts[classIdx]);
           // Only override if the original className looks like an ID (or just always override from URL since URL is human-readable)
           displayClass = parsedClass;
         }
         // Only use URL subject if subjectName prop wasn't explicitly provided
         if (!subjectName && parts[classIdx + 1]) {
           displaySubject = decodeURIComponent(parts[classIdx + 1]);
         }
      }
    }
  } catch (e) {}

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-amber-600/10 text-amber-500 border-amber-500/30 hover:bg-amber-600/20 shadow-sm whitespace-nowrap">
          {buttonLabel || (
            <>
              <Award className="w-4 h-4 mr-2" />
              Export Monthly Top 3
            </>
          )}
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
            className="relative w-[800px] h-[600px] bg-gradient-to-br from-zinc-950 via-[#0a0a0c] to-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 shrink-0"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
            }}
          >
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent"></div>
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center z-10 w-full mb-12 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 tracking-widest uppercase drop-shadow-sm">
                  Stars of the Month
                </h2>
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              </div>
              <h1 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">{monthName}</h1>
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-full px-6 py-2 shadow-inner backdrop-blur-sm">
                <p className="text-xl text-zinc-300 font-bold tracking-wide">
                  <span className="text-white">{displayClass}</span> {displaySubject ? <span className="text-zinc-500 mx-2">•</span> : ''} {displaySubject ? <span className="text-amber-400">{displaySubject}</span> : ''}
                </p>
              </div>
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 w-full z-10 px-8 flex-1 pb-4">
              {/* Silver */}
              {second && (
                <div className="flex flex-col items-center flex-1">
                  <div className="bg-zinc-800/80 border border-zinc-600/50 rounded-2xl p-4 w-full text-center mb-3 shadow-[0_10px_20px_rgba(0,0,0,0.3)] backdrop-blur-md relative transform hover:-translate-y-1 transition-transform">
                    <div className="text-xl font-bold text-white truncate px-2">{second.name}</div>
                    <div className="text-zinc-300 font-black mt-1.5 text-lg bg-zinc-900/50 rounded-lg py-1">{second.percentage}%</div>
                  </div>
                  <div className="w-full h-36 bg-gradient-to-t from-zinc-900 via-zinc-800 to-zinc-700 rounded-t-xl border-t-4 border-zinc-300 flex flex-col items-center pt-5 relative overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                    <Medal className="w-12 h-12 text-zinc-300 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] mb-2" />
                    <span className="text-4xl font-black text-zinc-400/80 tracking-tighter">2ND</span>
                  </div>
                </div>
              )}

              {/* Gold */}
              {first && (
                <div className="flex flex-col items-center flex-1 relative z-20 mx-2">
                  <div className="bg-gradient-to-b from-yellow-900/60 to-yellow-900/30 border-2 border-yellow-500/60 rounded-2xl p-5 w-[110%] text-center mb-3 shadow-[0_15px_30px_rgba(234,179,8,0.2)] backdrop-blur-md relative transform -translate-y-4">
                    <Trophy className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 text-yellow-400 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)] fill-yellow-400/20" />
                    <div className="text-3xl font-black text-white truncate px-2 mt-4 drop-shadow-md">{first.name}</div>
                    <div className="text-yellow-400 font-black mt-2 text-2xl bg-black/30 rounded-xl py-1.5 shadow-inner">{first.percentage}%</div>
                  </div>
                  <div className="w-full h-48 bg-gradient-to-t from-yellow-950 via-yellow-900/80 to-yellow-600/80 rounded-t-xl border-t-4 border-yellow-400 flex flex-col items-center pt-8 relative overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                    <span className="text-6xl font-black text-yellow-300/90 tracking-tighter drop-shadow-xl">1ST</span>
                  </div>
                </div>
              )}

              {/* Bronze */}
              {third && (
                <div className="flex flex-col items-center flex-1">
                  <div className="bg-orange-900/50 border border-orange-700/50 rounded-2xl p-4 w-full text-center mb-3 shadow-[0_10px_20px_rgba(0,0,0,0.3)] backdrop-blur-md relative transform hover:-translate-y-1 transition-transform">
                    <div className="text-xl font-bold text-white truncate px-2">{third.name}</div>
                    <div className="text-orange-300 font-black mt-1.5 text-lg bg-orange-950/50 rounded-lg py-1">{third.percentage}%</div>
                  </div>
                  <div className="w-full h-28 bg-gradient-to-t from-orange-950 via-orange-900/80 to-orange-800/90 rounded-t-xl border-t-4 border-orange-500 flex flex-col items-center pt-4 relative overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                    <Medal className="w-10 h-10 text-orange-400 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] mb-1" />
                    <span className="text-3xl font-black text-orange-400/80 tracking-tighter">3RD</span>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-5 right-8 flex items-center gap-2 opacity-60">
              <Star className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase">
                Generated by ResultMaker
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
