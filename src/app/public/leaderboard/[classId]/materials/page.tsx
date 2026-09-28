import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, GraduationCap, Globe, Lock, LogIn, FileText, DownloadCloud, Video, HardDrive, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareLeaderboardModal } from '@/components/share-leaderboard-modal'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getDrivePreviewUrl(url: string) {
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view.*$/, '/preview');
  }
  return url;
}

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
    orderBy: [
      { chapter: 'asc' },
      { topic: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  // Group materials
  const groupedMaterials: Record<string, Record<string, typeof materials>> = {}
  
  materials.forEach(mat => {
    const chapter = mat.chapter || 'General Resources'
    const topic = mat.topic || 'Uncategorized'
    
    if (!groupedMaterials[chapter]) groupedMaterials[chapter] = {}
    if (!groupedMaterials[chapter][topic]) groupedMaterials[chapter][topic] = []
    
    groupedMaterials[chapter][topic].push(mat)
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
              Study Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Watch embedded video lectures, read Google Drive textbooks, and download notes.
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
                  Resources
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-12">
            {Object.keys(groupedMaterials).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-card/30 rounded-3xl border border-border/50 border-dashed">
                <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No study resources have been added for this class yet.</p>
              </div>
            ) : (
              Object.entries(groupedMaterials).map(([chapter, topics]) => (
                <div key={chapter} className="space-y-6">
                  <div className="border-b border-border/40 pb-2">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{chapter}</h2>
                  </div>
                  
                  {Object.entries(topics).map(([topic, mats]) => (
                    <div key={topic} className="space-y-4">
                      {topic !== 'Uncategorized' && (
                        <h3 className="text-lg font-bold text-muted-foreground/80 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {topic}
                        </h3>
                      )}
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {mats.map(mat => (
                          <Card key={mat.id} className="bg-card border-border hover:shadow-lg transition-all overflow-hidden flex flex-col h-full">
                            
                            {/* Embed Preview Area */}
                            {mat.resourceType === 'YOUTUBE' && getYouTubeId(mat.fileUrl) && (
                              <div className="w-full aspect-video bg-black relative">
                                <iframe 
                                  src={`https://www.youtube.com/embed/${getYouTubeId(mat.fileUrl)}`}
                                  className="absolute top-0 left-0 w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            
                            {mat.resourceType === 'GOOGLE_DRIVE' && (
                              <div className="w-full h-48 bg-muted relative border-b border-border">
                                <iframe 
                                  src={getDrivePreviewUrl(mat.fileUrl)}
                                  className="absolute top-0 left-0 w-full h-full border-0"
                                  allow="autoplay"
                                />
                                {/* Overlay to prevent iframe capturing scrolls easily */}
                                <div className="absolute inset-0 bg-transparent pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" />
                              </div>
                            )}

                            <CardContent className="p-5 flex flex-col flex-grow justify-between gap-4">
                              <div>
                                <div className="flex items-start gap-3">
                                  <div className="mt-1">
                                    {mat.resourceType === 'YOUTUBE' && <Video className="w-5 h-5 text-red-500" />}
                                    {mat.resourceType === 'GOOGLE_DRIVE' && <HardDrive className="w-5 h-5 text-blue-500" />}
                                    {mat.resourceType === 'UPLOAD' && <FileText className="w-5 h-5 text-emerald-500" />}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg leading-tight">{mat.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                                      {mat.subject ? mat.subject.name : 'General Subject'}
                                    </p>
                                  </div>
                                </div>
                                {mat.description && <p className="text-sm text-foreground/80 mt-3 bg-muted/50 p-3 rounded-lg leading-relaxed">{mat.description}</p>}
                              </div>
                              
                              <div className="pt-4 flex justify-end gap-2 border-t border-border/50">
                                {mat.resourceType === 'UPLOAD' ? (
                                  <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="border-border">
                                      <DownloadCloud className="w-4 h-4 mr-2" />
                                      Download File
                                    </Button>
                                  </a>
                                ) : (
                                  <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="border-border">
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {mat.resourceType === 'YOUTUBE' ? 'Open in YouTube' : 'Open in Google Drive'}
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
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
