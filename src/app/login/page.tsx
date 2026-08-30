'use client'

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticate } from "./actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    try {
      const res = await authenticate(formData)
      if (typeof res === 'string') {
        setError(res)
      } else if (res && typeof res === 'object' && 'redirectUrl' in res) {
        window.location.href = res.redirectUrl
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="w-full flex items-center justify-center z-10 px-4">
        <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          <CardHeader className="space-y-3 pb-8 pt-8 px-8">
            <CardTitle className="text-3xl font-black tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-zinc-400 text-center text-base">
              Sign in to manage your school's results.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  className="bg-black/50 border-white/10 text-white h-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all rounded-xl" 
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Password</Label>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="bg-black/50 border-white/10 text-white h-12 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all rounded-xl" 
                  placeholder="••••••••"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
