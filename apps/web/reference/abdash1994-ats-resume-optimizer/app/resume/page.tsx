'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, BarChart2, Edit3, Lightbulb, Download, RefreshCw, Save, CheckCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResumeEditor } from '@/components/ResumeEditor';
import { ATSScorePanel } from '@/components/ATSScorePanel';
import { OptimizationSuggestions } from '@/components/OptimizationSuggestions';
import { ExportPanel } from '@/components/ExportPanel';
import { JDAnalyzer } from '@/components/JDAnalyzer';
import { AutoOptimize } from '@/components/AutoOptimize';
import { ResumePreview } from '@/components/ResumePreview';
import { scoreResume } from '@/lib/ats-engine/scorer';
import { generateSuggestions } from '@/lib/resume-optimizer/suggestion-engine';
import type { ResumeData, JobContext, ATSScore, OptimizationSuggestion } from '@/types/resume';
import { cn } from '@/lib/utils';

export default function ResumePage() {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [score, setScore] = useState<ATSScore | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [showExport, setShowExport] = useState(false);
  const [saved, setSaved] = useState(false);
  const scoreDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Declare runScoring before the useEffect that references it
  const runScoring = useCallback(async (r: ResumeData, jc: JobContext) => {
    setIsScoring(true);
    setScoreError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const newScore = scoreResume(r, jc);
      const newSuggestions = generateSuggestions(newScore, r, jc);
      setScore(newScore);
      setSuggestions(newSuggestions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setScoreError(msg);
      console.error('Scoring failed:', err);
    } finally {
      setIsScoring(false);
    }
  }, []);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ats-resume-data');
      if (stored) {
        const { resume: r, jobContext: jc } = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (r) setResume(r);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (jc) setJobContext(jc);
      }
    } catch {}
  }, []);

  // Auto-score when resume changes (debounced)
  useEffect(() => {
    if (!resume || !jobContext) return;
    clearTimeout(scoreDebounceRef.current);
    scoreDebounceRef.current = setTimeout(() => {
      runScoring(resume, jobContext);
    }, 800);
    return () => clearTimeout(scoreDebounceRef.current);
  }, [resume, jobContext, runScoring]);

  const handleAnalyze = useCallback(async (jc: JobContext) => {
    setJobContext(jc);
    if (resume) {
      await runScoring(resume, jc);
      setActiveTab('score');
    }
  }, [resume, runScoring]);

  const handleResumeChange = useCallback((updated: ResumeData) => {
    setResume(updated);
    setSaved(false);
  }, []);

  const handleApplySuggestion = useCallback((id: string, updated: ResumeData) => {
    setResume(updated);
    // Force immediate rescore after applying a fix
    if (jobContext) {
      setTimeout(() => runScoring(updated, jobContext), 100);
    }
    // Switch to score tab so user sees updated score
    setActiveTab('score');
  }, [jobContext, runScoring]);

  const handleSave = useCallback(() => {
    if (!resume) return;
    try {
      sessionStorage.setItem('ats-resume-data', JSON.stringify({ resume, jobContext }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }, [resume, jobContext]);

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">No resume loaded.</p>
          <Link href="/">
            <Button>Upload Resume</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                {resume.contact.name || 'Resume'}
              </p>
              {jobContext && (
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{jobContext.role}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {score && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all',
                score.total >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                score.total >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                score.total >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}>
                {isScoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <BarChart2 className="h-3.5 w-3.5" />}
                {isScoring ? 'Scoring...' : `Score: ${score.total} (${score.grade})`}
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleSave} className="gap-1.5">
              {saved ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
            </Button>

            <Button size="sm" onClick={() => setShowExport(!showExport)} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Editor */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Edit3 className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Resume Editor</h2>
                <span className="text-xs text-gray-400 ml-auto">Changes re-score automatically</span>
              </div>
              <div className="p-4">
                <ResumeEditor
                  resume={resume}
                  onChange={handleResumeChange}
                  missingKeywords={score?.missingKeywords}
                />
              </div>
            </div>

            {/* JD Analyzer - compact in sidebar */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <RefreshCw className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {jobContext ? 'Re-analyze with different JD' : 'Job Description Analysis'}
                </h2>
              </div>
              <div className="p-4">
                <JDAnalyzer
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isScoring}
                  initialContext={jobContext}
                />
              </div>
            </div>
          </div>

          {/* Right: Score + Suggestions */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden sticky top-20">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-4 pb-0">
                  <TabsList className="w-full">
                    <TabsTrigger value="score">
                      <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                      ATS Score
                      {score && <span className={cn(
                        'ml-1.5 text-xs font-bold',
                        score.total >= 90 ? 'text-green-500' :
                        score.total >= 75 ? 'text-blue-500' :
                        score.total >= 60 ? 'text-yellow-500' : 'text-red-500'
                      )}>{score.total}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions">
                      <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                      Fixes
                      {suggestions.length > 0 && (
                        <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                          {suggestions.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="export">
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  <TabsContent value="score">
                    {scoreError ? (
                      <div className="rounded-xl bg-red-950/30 border border-red-700 p-4 text-center">
                        <p className="text-sm font-semibold text-red-400 mb-1">Scoring error</p>
                        <p className="text-xs text-red-300 font-mono break-all">{scoreError}</p>
                      </div>
                    ) : score ? (
                      <div className="space-y-4">
                        {score.total < 90 && jobContext && (
                          <AutoOptimize
                            resume={resume}
                            score={score}
                            jobContext={jobContext}
                            onApply={(updated) => {
                              handleResumeChange(updated);
                              if (jobContext) {
                                setTimeout(() => runScoring(updated, jobContext), 150);
                              }
                            }}
                          />
                        )}
                        <ATSScorePanel score={score} />
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">Paste a job description to see your ATS score</p>
                        <p className="text-xs mt-1">The score updates automatically as you edit</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="suggestions">
                    {suggestions.length > 0 ? (
                      <OptimizationSuggestions
                        suggestions={suggestions}
                        resume={resume}
                        jobContext={jobContext}
                        preferredKeywords={score?.extractedKeywords.filter(k => k.importance === 'preferred' && !k.found).map(k => k.keyword) || []}
                        onApplySuggestion={handleApplySuggestion}
                        missingKeywords={score?.missingKeywords}
                      />
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">Analyze your JD to get optimization suggestions</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resume Preview</p>
                        <p className="text-xs text-gray-500">Reflects your current edits</p>
                      </div>
                      <ResumePreview resume={resume} />
                    </div>
                  </TabsContent>

                  <TabsContent value="export">
                    <ExportPanel resume={resume} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
