'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, Smartphone, LogOut, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function WhatsAppConnector() {
  const [status, setStatus] = useState<string>('connecting')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apiUrl = process.env.NEXT_PUBLIC_WHATSAPP_API_URL

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/status`)
      const data = await res.json()
      setStatus(data.status)
      setQrCode(data.qr)
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err)
      setStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await fetch(`${apiUrl}/api/logout`, { method: 'POST' })
      toast.success('Logged out successfully')
      setStatus('connecting')
      setQrCode(null)
    } catch (err) {
      toast.error('Failed to log out')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative mb-8">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400" />
      <CardHeader className="pb-4 pt-8 px-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <Smartphone className="w-6 h-6 text-green-400" />
          </div>
          WhatsApp Connection Status
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm mt-2">
          Link your WhatsApp account by scanning the QR code below. Your phone must stay connected to the internet.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-8 pb-8 flex flex-col items-center justify-center min-h-[250px]">
        {isLoading && status === 'connecting' && (
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-green-500" />
            <p>Waking up WhatsApp Server...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-red-500">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <p className="font-bold">Failed to reach the server.</p>
            <p className="text-sm text-muted-foreground mt-2">Make sure Render is running.</p>
          </div>
        )}

        {status === 'qr' && qrCode && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-border/50 mb-6">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Open WhatsApp {'>'} Linked Devices {'>'} Link a Device
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Connected & Ready!</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Your WhatsApp account is successfully linked and is actively processing the message queue in the background.
            </p>
            <Button onClick={handleLogout} variant="destructive" className="shadow-lg shadow-red-500/20">
              <LogOut className="w-4 h-4 mr-2" /> Disconnect Device
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
