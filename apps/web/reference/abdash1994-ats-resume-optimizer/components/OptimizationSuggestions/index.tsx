'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, Info, CheckCircle, ArrowRight, TrendingUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OptimizationSuggestion, ResumeData, JobContext } from '@/types/resume';
import type { AutoFixPayload } from '@/components/AutoFixModal';
import { AutoFixModal } from '@/components/AutoFixModal';

interface OptimizationSuggestionsProps {
  suggestions: OptimizationSuggestion[];
  resume: ResumeData;
  jobContext: JobContext | null;
  onApplySuggestion: (suggestionId: string, updatedResume: ResumeData) => void;
  missingKeywords?: string[];
  preferredKeywords?: string[];
  proApiKey?: string;
  proProvider?: 'groq' | 'openai' | 'anthropic';
}

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle, iconColor: 'text-red-500', border: 'border-red-200 dark:border-red-800/50' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Zap, iconColor: 'text-orange-500', border: 'border-orange-200 dark:border-orange-800/50' },
  medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Info, iconColor: 'text-yellow-500', border: 'border-gray-200 dark:border-gray-700' },
  low: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: Info, iconColor: 'text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
};

function SuggestionCard({
  suggestion,
  resume,
  jobContext,
  missingKeywords,
  preferredKeywords,
  proApiKey,
  proProvider,
  onApply,
}: {
  suggestion: OptimizationSuggestion;
  resume: ResumeData;
  jobContext: JobContext | null;
  missingKeywords: string[];
  preferredKeywords: string[];
  proApiKey?: string;
  proProvider?: 'groq' | 'openai' | 'anthropic';
  onApply: (id: string, resume: ResumeData) => void;
}) {
  const [applied, setApplied] = useState(false);
  const [modalPayload, setModalPayload] = useState<AutoFixPayload | null>(null);
  const config = PRIORITY_CONFIG[suggestion.priority];
  const Icon = config.icon;

  const buildPayload = async (): Promise<AutoFixPayload | null> => {
    const { generateSummary, generateSkillsAddition } = await import('@/lib/resume-optimizer/rewriter');

    if (suggestion.id === 'add-summary' || suggestion.id === 'summary-keywords') {
      const generated = generateSummary(resume, jobContext!, missingKeywords);
      return {
        type: 'summary',
        title: 'Generate Professional Summary',
        description: 'Review and edit before applying — include your real achievements',
        generatedContent: generated,
        currentContent: resume.summary || '',
      };
    }

    if (suggestion.id === 'expand-skills' || suggestion.id.startsWith('kw-missing-')) {
      const toAdd = generateSkillsAddition(resume.skills, missingKeywords, preferredKeywords);
      return {
        type: 'skills',
        title: 'Add Missing Keywords to Skills',
        description: 'Select which keywords to add — they match the job description',
        generatedContent: '',
        suggestedSkills: toAdd,
      };
    }

    if (suggestion.id === 'add-bullets') {
      const { generateMissingBullets } = await import('@/lib/resume-optimizer/rewriter');
      const generated = generateMissingBullets(resume, jobContext!);
      return {
        type: 'bullet',
        title: 'Generate Bullet Points for Empty Roles',
        description: 'Review these templates, fill in real numbers, then copy to your Experience editor',
        generatedContent: generated || 'No empty experience entries found.',
        currentContent: '',
      };
    }

    if (suggestion.id === 'quantify-bullets') {
      const { generateBulletImprovements } = await import('@/lib/resume-optimizer/rewriter');
      const improvements = generateBulletImprovements(resume);
      if (improvements.length === 0) return null;
      const preview = improvements.map(i => `Before: ${i.original}\nAfter:  ${i.improved}`).join('\n\n');
      return {
        type: 'bullet',
        title: 'Strengthen Bullet Points',
        description: 'Review suggested improvements — edit the "After" lines, then copy to your Experience editor',
        generatedContent: preview,
        currentContent: '',
      };
    }

    return null;
  };

  const handleAutoFix = async () => {
    if (!jobContext) return;
    const payload = await buildPayload();
    if (payload) setModalPayload(payload);
  };

  const handleModalApply = (updated: ResumeData) => {
    setApplied(true);
    onApply(suggestion.id, updated);
  };

  return (
    <>
      <div className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        applied ? 'opacity-60 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20' : config.border,
        'hover:shadow-sm'
      )}>
        <div className="flex gap-3">
          <div className={cn('shrink-0 mt-0.5', config.iconColor)}>
            {applied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className={cn('text-sm font-semibold', applied ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white')}>
                {applied ? 'Applied!' : suggestion.title}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />+{suggestion.impact}pts
                </span>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', config.color)}>
                  {suggestion.priority}
                </span>
              </div>
            </div>

            {!applied && (
              <>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{suggestion.description}</p>
                {suggestion.autoFixable && jobContext && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs gap-1.5 border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    onClick={handleAutoFix}
                  >
                    <Wand2 className="h-3 w-3" />
                    Generate &amp; Review
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AutoFixModal
        payload={modalPayload}
        resume={resume}
        jobContext={jobContext}
        proApiKey={proApiKey}
        proProvider={proProvider}
        onApply={handleModalApply}
        onClose={() => setModalPayload(null)}
      />
    </>
  );
}

export function OptimizationSuggestions({
  suggestions,
  resume,
  jobContext,
  onApplySuggestion,
  missingKeywords = [],
  preferredKeywords = [],
  proApiKey,
  proProvider,
}: OptimizationSuggestionsProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const filtered = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.priority === filter);

  const counts = {
    critical: suggestions.filter(s => s.priority === 'critical').length,
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
  };

  const totalImpact = suggestions.reduce((sum, s) => sum + s.impact, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <p className="text-sm font-semibold opacity-90">Potential score improvement</p>
        <p className="text-3xl font-black">+{Math.min(totalImpact, 40)} points</p>
        <p className="text-xs opacity-75 mt-1">
          {suggestions.length} suggestions · click <strong>Generate &amp; Review</strong> to auto-fix and edit before applying
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'all', label: `All (${suggestions.length})` },
          { id: 'critical', label: `🚨 Critical (${counts.critical})` },
          { id: 'high', label: `⚡ High (${counts.high})` },
          { id: 'medium', label: `💡 Medium (${counts.medium})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filter === f.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm">No {filter === 'all' ? '' : filter} suggestions! Great work.</p>
          </div>
        ) : (
          filtered.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              resume={resume}
              jobContext={jobContext}
              missingKeywords={missingKeywords}
              preferredKeywords={preferredKeywords}
              proApiKey={proApiKey}
              proProvider={proProvider}
              onApply={onApplySuggestion}
            />
          ))
        )}
      </div>
    </div>
  );
}
