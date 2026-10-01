'use client';

import React, { useState } from 'react';
import { Wand2, CheckCircle, X, ChevronRight, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ResumeData, JobContext, ATSScore } from '@/types/resume';

interface ChangeItem {
  section: string;
  type: 'added' | 'replaced' | 'improved';
  label: string;
  before?: string;
  after: string;
}

interface AutoOptimizeProps {
  resume: ResumeData;
  score: ATSScore;
  jobContext: JobContext;
  onApply: (updated: ResumeData) => void;
}

export function AutoOptimize({ resume, score, jobContext, onApply }: AutoOptimizeProps) {
  const [step, setStep] = useState<'idle' | 'generating' | 'review'>('idle');
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);

  const runOptimize = async () => {
    setStep('generating');
    const { generateSummary, generateSkillsAddition, generateBulletImprovements } = await import('@/lib/resume-optimizer/rewriter');

    const newChanges: ChangeItem[] = [];
    let updated = { ...resume };

    // 1. Generate summary if missing or weak
    if (!resume.summary || resume.summary.length < 80) {
      const newSummary = generateSummary(resume, jobContext, score.missingKeywords);
      updated = { ...updated, summary: newSummary };
      newChanges.push({
        section: 'Professional Summary',
        type: resume.summary ? 'replaced' : 'added',
        label: resume.summary ? 'Summary rewritten with JD keywords' : 'Professional summary generated',
        before: resume.summary || undefined,
        after: newSummary,
      });
    }

    // 2. Add missing keywords to skills
    const skillsToAdd = generateSkillsAddition(
      resume.skills,
      score.missingKeywords,
      score.extractedKeywords.filter(k => k.importance === 'preferred' && !k.found).map(k => k.keyword)
    );
    if (skillsToAdd.length > 0) {
      updated = { ...updated, skills: [...new Set([...resume.skills, ...skillsToAdd])] };
      newChanges.push({
        section: 'Skills',
        type: 'added',
        label: `Added ${skillsToAdd.length} missing JD keywords`,
        after: skillsToAdd.join(', '),
      });
    }

    // 3. Improve weak bullets in experience
    const bulletImprovements = generateBulletImprovements(resume);
    if (bulletImprovements.length > 0) {
      const newExperience = updated.experience.map(exp => ({
        ...exp,
        bullets: exp.bullets.map(bullet => {
          const imp = bulletImprovements.find(b => b.original === bullet);
          return imp ? imp.improved : bullet;
        }),
      }));
      updated = { ...updated, experience: newExperience };
      bulletImprovements.slice(0, 3).forEach(imp => {
        newChanges.push({
          section: 'Experience',
          type: 'improved',
          label: 'Bullet strengthened with action verb + quantification',
          before: imp.original,
          after: imp.improved,
        });
      });
      if (bulletImprovements.length > 3) {
        newChanges.push({
          section: 'Experience',
          type: 'improved',
          label: `+${bulletImprovements.length - 3} more bullets improved`,
          after: 'Action verbs & quantification placeholders added',
        });
      }
    }

    setOptimizedResume(updated);
    setChanges(newChanges);
    setStep('review');
  };

  const handleConfirm = () => {
    if (optimizedResume) {
      onApply(optimizedResume);
      setStep('idle');
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setChanges([]);
    setOptimizedResume(null);
  };

  const potentialGain = Math.min(
    (!resume.summary || resume.summary.length < 80 ? 12 : 0) +
    (score.missingKeywords.length > 0 ? 15 : 0) +
    (resume.experience.flatMap(e => e.bullets).filter(b => !/\d+%|\$\d+|\d+[KMBx]/i.test(b)).length > 0 ? 10 : 0),
    40
  );

  if (step === 'idle') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Auto-Optimize Resume</h3>
            <p className="text-sm text-blue-100 mt-0.5">
              Fix all detected issues in one click — review every change before applying
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 bg-white/10 rounded-xl p-3">
          <div className="text-center">
            <p className="text-2xl font-black">{score.total}</p>
            <p className="text-xs text-blue-200">Current</p>
          </div>
          <ChevronRight className="h-5 w-5 text-blue-300" />
          <div className="text-center">
            <p className="text-2xl font-black text-green-300">{Math.min(score.total + potentialGain, 99)}+</p>
            <p className="text-xs text-blue-200">Est. after fixes</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-green-300">+{potentialGain}+ pts</p>
            <p className="text-xs text-blue-200">{changes.length || '3-5'} fixes</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4">
          {[
            { done: !!resume.summary && resume.summary.length >= 80, label: 'Professional summary' },
            { done: score.missingKeywords.length === 0, label: 'All JD keywords in skills' },
            { done: resume.experience.flatMap(e => e.bullets).every(b => /\d+%|\$\d+|\d+[KMBx]/i.test(b)), label: 'Quantified bullet points' },
          ].map(({ done, label }) => (
            <div key={label} className={cn('flex items-center gap-2 text-sm', done ? 'text-green-300' : 'text-blue-100')}>
              {done ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-blue-300 shrink-0" />}
              {label}
              {done && <span className="text-xs text-green-400 ml-auto">✓ Done</span>}
              {!done && <span className="text-xs text-yellow-300 ml-auto">Will fix</span>}
            </div>
          ))}
        </div>

        <Button
          onClick={runOptimize}
          className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold h-11 gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Auto-Optimize Now
        </Button>
        <p className="text-xs text-blue-200 text-center mt-2">
          You'll review every change before it's applied
        </p>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin" />
        <p className="font-bold text-lg">Optimizing your resume...</p>
        <p className="text-sm text-blue-200 mt-1">Generating summary · Adding keywords · Improving bullets</p>
      </div>
    );
  }

  // Review step
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-green-950/30 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-green-400" />
          <span className="text-sm font-bold text-white">{changes.length} changes ready to apply</span>
        </div>
        <button onClick={handleCancel} className="text-gray-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-700/50">
        {changes.map((change, i) => (
          <div key={i} className="p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
                change.type === 'added' ? 'bg-green-900/50 text-green-300' :
                change.type === 'replaced' ? 'bg-blue-900/50 text-blue-300' :
                'bg-orange-900/50 text-orange-300'
              )}>
                {change.section}
              </span>
              <span className="text-xs text-gray-300 font-medium">{change.label}</span>
            </div>
            {change.before && (
              <p className="text-xs text-red-400 line-through bg-red-950/20 rounded p-2 leading-relaxed">
                {change.before.slice(0, 120)}{change.before.length > 120 ? '...' : ''}
              </p>
            )}
            <p className="text-xs text-green-300 bg-green-950/20 rounded p-2 leading-relaxed">
              {change.after.slice(0, 160)}{change.after.length > 160 ? '...' : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700">
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700 gap-1.5 font-bold">
          <CheckCircle className="h-4 w-4" />
          Apply All &amp; Rescore
        </Button>
      </div>
    </div>
  );
}
