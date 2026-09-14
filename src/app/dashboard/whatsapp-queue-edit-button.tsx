'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, Loader2, Check } from 'lucide-react'
import { updateQueueMessage } from './queue-actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WhatsAppQueueEditButton({ id, currentMessage, currentPhone, disabled }: { id: string, currentMessage: string, currentPhone: string, disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState(currentMessage)
  const [phone, setPhone] = useState(currentPhone)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!message.trim()) {
      toast.error('Message cannot be empty')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number cannot be empty')
      return
    }
    
    setIsSaving(true)
    const res = await updateQueueMessage(id, message, phone)
    if (res.success) {
      toast.success('Message updated successfully')
      setIsOpen(false)
    } else {
      toast.error(res.error)
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) {
        setMessage(currentMessage)
        setPhone(currentPhone)
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={disabled}
          className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 h-8 w-8 mr-1"
          title="Edit queued message"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Pending Message</DialogTitle>
          <DialogDescription>
            You can modify the phone number or the text of this message before it gets sent.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase font-semibold">Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-background border-border text-foreground focus-visible:ring-blue-500/50"
              placeholder="e.g. 03001234567"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase font-semibold">Message Text</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] bg-background border-border text-foreground focus-visible:ring-blue-500/50"
              placeholder="Type your message here..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
