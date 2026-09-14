'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteQueueItem } from './queue-actions'
import { useState } from 'react'

export function WhatsAppQueueDeleteButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this message from the queue?')) {
      setIsDeleting(true)
      await deleteQueueItem(id)
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8"
      title="Remove from queue"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
