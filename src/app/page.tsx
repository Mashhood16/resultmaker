import Link from 'next/link'
import { ArrowRight, CheckCircle2, Shield, Zap, FileText, BarChart3, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            The Future of School Administration
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Manage Results with <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Absolute Precision.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-zinc-400 mx-auto mb-10">
            ResultMaker transforms raw student marks into comprehensive, beautiful PDF report cards and interactive leaderboards in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-full text-lg w-full sm:w-auto transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full text-lg w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-white/10 bg-black/50 backdrop-blur-3xl">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything a school needs</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Stop wrestling with complex spreadsheets. ResultMaker automates the entire academic result pipeline.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Automated Report Cards",
              description: "Generate stunning portrait or landscape PDF report cards for single or multiple terms instantly.",
              icon: FileText,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20"
            },
            {
              title: "Master Student Roster",
              description: "Manage your entire school's student body in one unified database with automatic deduplication.",
              icon: Database,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20"
            },
            {
              title: "Interactive Leaderboards",
              description: "Live, dynamic rankings for every class and subject to gamify and track academic performance.",
              icon: BarChart3,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${feature.bg}`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 text-center">
        <p className="text-zinc-500 font-medium">© {new Date().getFullYear()} ResultMaker. All rights reserved.</p>
      </footer>
    </main>
  )
}
