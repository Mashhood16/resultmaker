import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, GraduationCap, Globe, Lock, LogIn, FileText, DownloadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareLeaderboardModal } from '@/components/share-leaderboard-modal'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function PublicMaterialsPage({
  params
}: {
  params: { classId: string }
}) {
  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      school: {
        select: { id: true, name: true }
      }
    }
  })

  if (!classData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Class Not Found</h2>
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="border-border">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Find all subjects for the tabs
  const subjects = await prisma.subject.findMany({
    where: {
      scores: {
        some: {
          student: {
            classId: classData.id
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Fetch materials for this class
  const materials = await prisma.classMaterial.findMany({
    where: { classId: classData.id },
    include: { subject: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Public Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/60 border border-border/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" />
                {classData.school?.name || 'School'}
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0.5 px-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Public Access
              </Badge>
              <Badge variant="outline" className="bg-zinc-500/10 text-muted-foreground border-border text-xs py-0.5 px-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Read-Only
              </Badge>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {classData.name} Downloads
            </h1>
            <p className="text-sm text-muted-foreground">
              Download class textbooks, notes, and past papers.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <ShareLeaderboardModal
              classId={classData.id}
              className={classData.name}
              schoolName={classData.school?.name}
              buttonText="Share Link"
            />
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Staff Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Subject Navigation Tabs & Content */}
        <div className="space-y-6">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2">
              {subjects.map((sub) => (
                <Link 
                  key={sub.id} 
                  href={`/public/leaderboard/${classData.id}/${encodeURIComponent(sub.id)}`}
                >
                  <Button 
                    variant="outline"
                    className="whitespace-nowrap rounded-xl transition-all bg-card border-border text-muted-foreground hover:text-foreground"
                  >
                    {sub.name}
                  </Button>
                </Link>
              ))}
              <Link href={`/public/leaderboard/${classData.id}/materials`}>
                <Button 
                  variant="default"
                  className="whitespace-nowrap rounded-xl transition-all bg-emerald-600 hover:bg-emerald-700 text-foreground border-transparent shadow-md"
                >
                  Downloads
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(mat => (
              <Card key={mat.id} className="bg-card/50 border-border hover:bg-card/80 transition-colors">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <FileText className="w-5 h-5 shrink-0" />
                        <span className="font-bold line-clamp-1">{mat.title}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {mat.subject ? `• ${mat.subject.name}` : '• General Material'}
                    </p>
                    {mat.description && <p className="text-sm text-foreground line-clamp-2">{mat.description}</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-border">
                        <DownloadCloud className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
            {materials.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-3xl border border-border/50 border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No materials or textbooks have been uploaded for this class yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <footer className="pt-8 pb-12 text-center text-xs text-muted-foreground border-t border-border/40">
          <p>This is a read-only public view provided by ResultMaker for students and parents.</p>
        </footer>
      </div>
    </div>
  )
}
