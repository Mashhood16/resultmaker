import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react'

export async function WhatsAppQueueView() {
  const queue = await prisma.whatsAppQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Show latest 100
    include: { student: true }
  })

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400" />
        
        <CardHeader className="pb-4 pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <MessageSquare className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"/> 
            </div>
            WhatsApp Message Queue
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            View the status of the last 100 messages sent to the local WhatsApp dispatcher.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-background/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-bold">Status</TableHead>
                  <TableHead className="text-muted-foreground">Student</TableHead>
                  <TableHead className="text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-muted-foreground w-1/2">Message</TableHead>
                  <TableHead className="text-right text-muted-foreground">Queued At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No messages in the queue yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  queue.map((msg) => (
                    <TableRow key={msg.id} className="border-border hover:bg-accent/30 transition-colors">
                      <TableCell>
                        {msg.status === 'PENDING' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                        {msg.status === 'SENT' && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</Badge>}
                        {msg.status === 'FAILED' && <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1"/> Failed</Badge>}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{msg.student?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{msg.phone}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{msg.message}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {new Date(msg.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
