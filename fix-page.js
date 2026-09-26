const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(/CendroClass/g, 'ResultMaker');
content = content.replace("import { ArrowRight, FileText, BarChart3, Database, Users, Shield, Zap, Trophy } from 'lucide-react'", "import { ArrowRight, FileText, BarChart3, Database, Users, Shield, Zap, Trophy, MessageCircle, LineChart, Award } from 'lucide-react'");

const bentoOld = `Everything a school needs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Stop wrestling with manual grading. ResultMaker automates the entire assessment pipeline from online tests to live 3D leaderboards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[280px]">
          {/* Feature 1 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-blue-500/10 border-blue-500/20">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">AI Auto-Grading & Feedback</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Let students take tests online. Our AI instantly grades submissions, assigns per-question marks based on your rubric, and provides personalized Roman Urdu feedback with deduction reasoning.</p>
            </div>
          </div>

          {/* Feature 2 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-purple-500/10 border-purple-500/20">
                <Trophy className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Interactive Podiums</h3>
              <p className="text-muted-foreground leading-relaxed">Live, dynamic 3D-style podium leaderboards to celebrate student success for every class and subject.</p>
            </div>
          </div>

          {/* Feature 3 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-amber-500/10 border-amber-500/20">
                <FileText className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Digital Pen Tool</h3>
              <p className="text-muted-foreground leading-relaxed">Prefer grading by hand? Use our integrated digital pen tool to manually annotate test images.</p>
            </div>
          </div>

          {/* Feature 4 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group flex flex-col justify-end">
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 flex flex-col items-end text-right">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-indigo-500/10 border-indigo-500/20 mr-0 ml-auto">
                <Database className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Offline Roster Sync</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Seamlessly upload Excel (.xlsx) or CSV files to instantly update real-time leaderboards with offline exam marks.</p>
            </div>
          </div>`;

const bentoNew = `Everything a school needs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Stop wrestling with manual grading. ResultMaker automates the entire assessment pipeline from offline tests to live 3D leaderboards and beautiful certificates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[280px]">
          {/* Feature 1 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-yellow-500/10 border-yellow-500/20">
                <Award className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Beautiful Certificates & Podiums</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Live, dynamic 3D-style podium leaderboards. One-click export for stunning Monthly Stars certificates (Gold, Silver, Bronze) perfect for social media and class groups.</p>
            </div>
          </div>

          {/* Feature 2 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-emerald-500/10 border-emerald-500/20">
                <MessageCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">WhatsApp Integration</h3>
              <p className="text-muted-foreground leading-relaxed">Auto-generates personalized WhatsApp messages with emojis based on student performance tiers (Platinum, Gold, Silver, Bronze).</p>
            </div>
          </div>

          {/* Feature 3 - Standard */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
             <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-blue-500/10 border-blue-500/20">
                <LineChart className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Deep Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">Visualize class trends and grade distributions to monitor academic health across individual tests and overall months.</p>
            </div>
          </div>

          {/* Feature 4 - Large spanning 2 columns */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-all duration-300 md:col-span-2 relative overflow-hidden group flex flex-col justify-end">
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 flex flex-col items-end text-right">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-indigo-500/10 border-indigo-500/20 mr-0 ml-auto">
                <Trophy className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Overall Class Performance</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">Instantly aggregate scores across all subjects for a unified Overall Class Leaderboard, complete with individual test breakdowns for every student.</p>
            </div>
          </div>`;

content = content.replace(bentoOld, bentoNew);
fs.writeFileSync('src/app/page.tsx', content);
console.log('done');
