'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Globe, Lock, Star, BarChart2, FileText, Download, Sparkles } from 'lucide-react';
import { ResumeUploader } from '@/components/ResumeUploader';
import { JDAnalyzer } from '@/components/JDAnalyzer';
import type { ResumeData, JobContext } from '@/types/resume';

const FEATURES = [
  { icon: <FileText className="h-5 w-5" />, title: 'Parse Any Format', desc: 'PDF, DOCX, HTML, Markdown, or even a photo of your resume via OCR' },
  { icon: <BarChart2 className="h-5 w-5" />, title: 'ATS Score in Real-Time', desc: 'Scored against 15+ ATS systems including Taleo, Workday, Greenhouse & more' },
  { icon: <Sparkles className="h-5 w-5" />, title: 'Smart Optimization', desc: 'Keyword gap analysis, section scoring, and ranked fix suggestions with one-click apply' },
  { icon: <Download className="h-5 w-5" />, title: 'Export ATS-Safe', desc: 'Download as ATS-safe PDF, DOCX, HTML, or Markdown — no tables, no columns' },
  { icon: <Lock className="h-5 w-5" />, title: '100% Private', desc: 'Everything runs in your browser. Nothing is sent to any server. Ever.' },
  { icon: <Globe className="h-5 w-5" />, title: 'Works Offline', desc: 'Install as a PWA — fully functional without internet after first load' },
];

const ATS_SYSTEMS = ['Taleo', 'Workday', 'Greenhouse', 'iCIMS', 'Lever', 'SAP SuccessFactors', 'Jobvite', 'ADP', 'BambooHR', 'SmartRecruiters', 'Bullhorn', 'Rippling', 'Ashby', 'JazzHR', 'Workable'];

export default function HomePage() {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [fileName, setFileName] = useState('');
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [step, setStep] = useState<'upload' | 'analyze'>('upload');

  const handleParsed = useCallback((r: ResumeData, name: string) => {
    setResume(r);
    setFileName(name);
    setStep('analyze');
  }, []);

  const handleAnalyze = useCallback((jc: JobContext) => {
    if (!resume) return;
    sessionStorage.setItem('ats-resume-data', JSON.stringify({ resume, jobContext: jc }));
    setJobContext(jc);
    router.push('/resume');
  }, [resume, router]);

  const handleSkipJD = useCallback(() => {
    if (!resume) return;
    sessionStorage.setItem('ats-resume-data', JSON.stringify({ resume, jobContext: null }));
    router.push('/resume');
  }, [resume, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-6">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-blue-300">Target 90-95% ATS Pass Rate — Free, Offline, Private</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            Beat Every{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ATS Filter
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Upload your resume in any format. Paste any job description. Get a real-time ATS score, 
            fix every issue, and download an optimized resume that passes screening automatically.
          </p>

          {/* ATS systems marquee */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {ATS_SYSTEMS.map(ats => (
              <span key={ats} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-400">
                {ats}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main App Card */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          {/* Step Indicator */}
          <div className="flex border-b border-white/10">
            {[
              { num: 1, label: 'Upload Resume', active: step === 'upload', done: step === 'analyze' },
              { num: 2, label: 'Enter Job Details', active: step === 'analyze', done: false },
            ].map((s, i) => (
              <div key={i} className={`flex-1 flex items-center gap-3 px-6 py-4 ${i === 0 ? 'border-r border-white/10' : ''}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  s.done ? 'bg-green-500 text-white' :
                  s.active ? 'bg-blue-600 text-white' :
                  'bg-white/10 text-gray-500'
                }`}>
                  {s.done ? '✓' : s.num}
                </div>
                <span className={`text-sm font-semibold ${s.active ? 'text-white' : s.done ? 'text-green-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6">
            {step === 'upload' ? (
              <ResumeUploader onParsed={handleParsed} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-gray-400">Resume loaded:</span>
                    <span className="font-semibold text-white">{fileName}</span>
                  </div>
                  <button
                    onClick={() => setStep('upload')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <JDAnalyzer onAnalyze={handleAnalyze} initialContext={jobContext} />

                <div className="text-center">
                  <button
                    onClick={handleSkipJD}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors underline"
                  >
                    Skip for now — just open the editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-all">
              <div className="h-9 w-9 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3">
                {f.icon}
              </div>
              <p className="text-sm font-bold text-white mb-1">{f.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            <Lock className="h-3 w-3 inline mr-1" />
            Your resume never leaves your device. All processing happens locally in your browser.
            No account, no signup, no tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
