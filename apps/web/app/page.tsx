import Link from "next/link";
import { ArrowRight, BarChart3, Bot, FileSearch } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none -z-10" />

      <section className="text-center space-y-8 max-w-4xl animate-fade-in-up">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-bed border border-line text-muted mb-4">
          <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
          ATS Engine v2.0 is live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-ink leading-[1.1]">
          Read your CV the way an <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
            ATS parser does.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Upload your resume and a target job description. We’ll show you exactly how automated systems extract your skills, where you lose points, and what to fix. No buzzwords, just deterministic data.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href={"/analyze" as any}
            className="inline-flex items-center gap-2 bg-ink text-sheet px-6 py-3 rounded-sheet font-medium transition-transform hover:scale-105 active:scale-95 shadow-sheet"
          >
            Start free analysis
            <ArrowRight size={18} />
          </Link>
          <Link
            href={"/login" as any}
            className="inline-flex items-center gap-2 bg-transparent text-ink border border-line px-6 py-3 rounded-sheet font-medium transition-colors hover:border-ink"
          >
            Sign in to save
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mt-24">
        <div className="sheet p-8 space-y-4 hover:border-ink/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-bed flex items-center justify-center text-ink border border-line">
            <FileSearch size={24} />
          </div>
          <h3 className="text-xl font-semibold text-ink">Deterministic Parsing</h3>
          <p className="text-muted text-sm leading-relaxed">
            We don&apos;t use LLMs to guess your score. Our parser extracts text and matches skills against a strict taxonomy, just like legacy enterprise systems.
          </p>
        </div>

        <div className="sheet p-8 space-y-4 hover:border-ink/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-bed flex items-center justify-center text-ink border border-line">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-xl font-semibold text-ink">Actionable Scoring</h3>
          <p className="text-muted text-sm leading-relaxed">
            Every point lost is explained. See exactly which required skills were missed and where your document formatting broke the parser.
          </p>
        </div>

        <div className="sheet p-8 space-y-4 hover:border-ink/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-bed flex items-center justify-center text-ink border border-line">
            <Bot size={24} />
          </div>
          <h3 className="text-xl font-semibold text-ink">Local AI Agent</h3>
          <p className="text-muted text-sm leading-relaxed">
            While the score is strict, our embedded AI agent explains the results in plain language and suggests specific ways to rewrite weak bullet points.
          </p>
        </div>
      </section>
      
      {/* Footer / Privacy note */}
      <footer className="mt-24 text-center pb-8">
        <p className="text-xs text-muted max-w-lg mx-auto">
          Files are processed temporarily on our secure servers and deleted immediately after analysis. We do not use your CV to train AI models.
        </p>
      </footer>
    </main>
  );
}
