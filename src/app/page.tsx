import Link from 'next/link'
import { ArrowRight, FileText, BarChart3, Database, Users, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background -z-10" />
      
      {/* Split Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
          <div className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-card border border-border text-indigo-400 text-sm font-semibold tracking-wide uppercase shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            The Future of School Administration
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-foreground leading-[1.1]">
            Manage Results with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Absolute Precision.
            </span>
          </h1>
          <p className="mt-4 text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
            ResultMaker transforms raw student marks into comprehensive, beautiful PDF report cards and interactive leaderboards in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-lg w-full sm:w-auto transition-all shadow-lg hover:shadow-primary/25">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 bg-card border-border text-foreground hover:bg-accent rounded-full text-lg w-full sm:w-auto shadow-sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Abstract Visual Right Side */}
        <div className="lg:w-1/2 relative w-full h-[400px] lg:h-[600px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
          {/* Abstract overlapping cards representing UI */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm sm:max-w-md h-[300px] sm:h-[400px] perspective-1000">
            {/* Back Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-3xl border border-border/50 shadow-2xl backdrop-blur-sm transform rotate-6 translate-x-4 translate-y-4 sm:translate-x-8 sm:translate-y-8" />
            {/* Middle Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-3xl border border-border/50 shadow-2xl backdrop-blur-md transform -rotate-3 -translate-x-2 translate-y-2 sm:-translate-x-4 sm:translate-y-4" />
            {/* Front Card */}
            <div className="absolute inset-0 bg-card rounded-3xl border border-border shadow-2xl backdrop-blur-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-5 sm:h-7 bg-primary/20 rounded-lg w-1/3" />
                <div className="h-6 sm:h-8 w-6 sm:w-8 bg-muted rounded-full" />
              </div>
              <div className="w-full h-16 sm:h-24 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl flex items-center px-4 sm:px-6">
                <div className="h-8 sm:h-12 w-8 sm:w-12 rounded-full bg-primary/20 flex-shrink-0" />
                <div className="ml-4 space-y-2 w-full">
                  <div className="h-2 sm:h-3 bg-primary/30 rounded-full w-1/2" />
                  <div className="h-2 sm:h-3 bg-primary/10 rounded-full w-3/4" />
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-1 h-16 sm:h-20 bg-muted/50 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
                  <div className="h-2 sm:h-3 bg-muted-foreground/30 rounded-full w-1/2" />
                  <div className="h-4 sm:h-6 bg-muted-foreground/20 rounded-full w-3/4" />
                </div>
                <div className="flex-1 h-16 sm:h-20 bg-muted/50 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
                  <div className="h-2 sm:h-3 bg-muted-foreground/30 rounded-full w-1/2" />
                  <div className="h-4 sm:h-6 bg-muted-foreground/20 rounded-full w-3/4" />
                </div>
              </div>
              <div className="w-full h-10 sm:h-14 bg-muted/30 rounded-xl mt-auto flex items-center px-3 sm:px-4 gap-3">
                 <div className="h-4 sm:h-5 w-4 sm:w-5 rounded-full bg-primary/40 flex-shrink-0" />
                 <div className="h-2 sm:h-2.5 w-16 sm:w-24 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>
          </div>
          {/* Glowing orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -z-10" />
        </div>
      </div>

      {/* Bento Grid Feature Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border bg-background/50 backdrop-blur-3xl">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Everything a school needs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Stop wrestling with complex spreadsheets. ResultMaker automates the entire academic result pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {/* Feature 1 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-blue-500/10 border-blue-500/20">
                <FileText className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Automated Report Cards</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Generate stunning portrait or landscape PDF report cards for single or multiple terms instantly. Say goodbye to manual formatting.</p>
            </div>
          </div>

          {/* Feature 2 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-purple-500/10 border-purple-500/20">
                <Database className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Master Roster</h3>
              <p className="text-muted-foreground leading-relaxed">Manage your entire student body in one unified database.</p>
            </div>
          </div>

          {/* Feature 3 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-amber-500/10 border-amber-500/20">
                <BarChart3 className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Interactive Leaderboards</h3>
              <p className="text-muted-foreground leading-relaxed">Live, dynamic rankings for every class and subject.</p>
            </div>
          </div>

          {/* Feature 4 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group flex flex-col justify-end">
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 flex flex-col items-end text-right">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-indigo-500/10 border-indigo-500/20 mr-0 ml-auto">
                <Zap className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Lightning Fast Processing</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Process thousands of student records and generate PDFs in milliseconds with our highly optimized edge infrastructure.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <p className="text-muted-foreground font-medium relative z-10">© {new Date().getFullYear()} ResultMaker. All rights reserved.</p>
      </footer>
    </main>
  )
}
