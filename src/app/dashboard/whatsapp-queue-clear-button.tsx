'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { clearQueue } from './queue-actions'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WhatsAppQueueClearButton() {
  const [isClearing, setIsClearing] = useState(false)

  const handleClear = async (status?: 'PENDING' | 'SENT' | 'FAILED') => {
    const type = status ? status.toLowerCase() : 'all'
    if (confirm(`Are you sure you want to clear ${type} messages from the queue?`)) {
      setIsClearing(true)
      await clearQueue(status)
      setIsClearing(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isClearing} className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Queue
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem onClick={() => handleClear('PENDING')} className="cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10">
          Clear Pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleClear('SENT')} className="cursor-pointer text-green-500 focus:text-green-500 focus:bg-green-500/10">
          Clear Sent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleClear('FAILED')} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
          Clear Failed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleClear()} className="cursor-pointer font-bold text-red-600 focus:text-red-600 focus:bg-red-500/10">
          Clear All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
