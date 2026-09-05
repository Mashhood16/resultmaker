'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { claimTestAccess } from './claim-actions'

export default function PinEntryClient({
  classId,
  testId,
  testTitle
}: {
  classId: string
  testId: string
  testTitle: string
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAccess = async () => {
    if (!name.trim() || !rollNumber.trim()) {
      toast.error('Please enter your Name and Roll Number.')
      return
    }

    if (!pin.trim()) {
      toast.error('Please enter the Access PIN provided by your teacher.')
      return
    }

    setLoading(true)
    const res = await claimTestAccess(classId, testId, name.trim(), rollNumber.trim(), pin.trim())
    
    if (res.error) {
      toast.error(res.error)
      setLoading(false)
      return
    }

    if (res.variantId) {
      toast.success('Access Granted!')
      router.push(`/${classId}/test/${testId}/take/${res.variantId}?roll=${encodeURIComponent(rollNumber.trim())}&name=${encodeURIComponent(name.trim())}`)
    } else {
      toast.error('Unexpected error unlocking test.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/20 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{testTitle}</CardTitle>
        <CardDescription>Enter your details and the Access PIN provided by your teacher.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input 
            placeholder="e.g. John Doe" 
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Roll Number</Label>
          <Input 
            placeholder="e.g. 101" 
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2 pt-2 border-t">
          <Label>Access PIN</Label>
          <Input 
            type="text"
            placeholder="e.g. 1234" 
            className="text-center text-2xl tracking-[0.5em] font-mono h-14 uppercase"
            value={pin}
            onChange={e => setPin(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAccess()}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full h-12 text-lg font-bold" onClick={handleAccess} disabled={loading || pin.length < 2}>
          {loading ? 'Verifying...' : 'Unlock Test'} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </CardFooter>
    </Card>
  )
}
