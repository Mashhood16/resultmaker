'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Share2, Copy, Check, ExternalLink, Globe, Lock, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ShareLeaderboardModalProps {
  classId: string
  className: string
  schoolName?: string
  trigger?: React.ReactNode
  variant?: 'button' | 'icon'
  buttonText?: string
}

export function ShareLeaderboardModal({
  classId,
  className,
  schoolName,
  trigger,
  variant = 'button',
  buttonText = 'Share Public Link'
}: ShareLeaderboardModalProps) {
  const [copied, setCopied] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      setPublicUrl(`${origin}/public/leaderboard/${classId}`)
    }
  }, [classId])

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Public leaderboard link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = publicUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success('Public leaderboard link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const shareText = `🏆 View the live ${className} Leaderboard${schoolName ? ` at ${schoolName}` : ''} on CendroClass: ${publicUrl}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`

  const defaultTrigger = variant === 'icon' ? (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-xl border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors shadow-sm"
      title="Share Public Link"
      onClick={(e) => {
        e.stopPropagation()
        setOpen(true)
      }}
    >
      <Share2 className="w-4 h-4" />
    </Button>
  ) : (
    <Button
      variant="outline"
      className="border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors shadow-sm rounded-xl font-medium"
      onClick={(e) => {
        e.stopPropagation()
        setOpen(true)
      }}
    >
      <Share2 className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  )

  return (
    <>
      {trigger ? (
        <div onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="inline-flex">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="sm:max-w-md bg-card border-border text-foreground shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Share {className} Leaderboard
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Students and parents can view live rankings without logging in.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Security & Access Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs py-1 px-2.5">
              <Globe className="w-3 h-3 mr-1" />
              No Sign-In Required
            </Badge>
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs py-1 px-2.5">
              <Lock className="w-3 h-3 mr-1" />
              Read-Only
            </Badge>
          </div>

          {/* Public Link Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Public Leaderboard Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={publicUrl}
                className="bg-background border-border text-foreground font-mono text-xs select-all h-10 rounded-xl"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                onClick={handleCopy}
                className="shrink-0 h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-emerald-300 animate-in zoom-in" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-border bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-800/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Share on WhatsApp
              </Button>
            </a>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-border bg-background hover:bg-accent text-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                Test Public Link
              </Button>
            </a>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs text-muted-foreground leading-relaxed">
            💡 <strong>Note:</strong> Anyone with this link can view class rankings, medals, and score trends. Administrative operations (editing scores, exporting student records) remain strictly protected.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
)
}
