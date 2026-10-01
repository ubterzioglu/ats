'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ATSScore, ATSScoreDimension, PerATSScore } from '@/types/resume';

interface ATSScorePanelProps {
  score: ATSScore;
}

function GradeRing({ grade, total }: { grade: string; total: number }) {
  const color =
    total >= 90 ? '#22c55e' :
    total >= 75 ? '#3b82f6' :
    total >= 60 ? '#eab308' :
    total >= 45 ? '#f97316' : '#ef4444';

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (total / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" className="dark:stroke-gray-700" />
        <circle
          cx="60" cy="60" r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-gray-900 dark:text-white" style={{ color }}>{total}</span>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">/ 100</span>
        <span className="text-lg font-black" style={{ color }}>Grade {grade}</span>
      </div>
    </div>
  );
}

function DimensionCard({ dim }: { dim: ATSScoreDimension }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{dim.name}</span>
            <span className={cn(
              'text-sm font-bold ml-2',
              dim.score >= 80 ? 'text-green-600 dark:text-green-400' :
              dim.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            )}>
              {dim.score}%
            </span>
          </div>
          <Progress value={dim.score} className="h-2" />
        </div>
        <div className="shrink-0 ml-2">
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
          {dim.items.map(item => (
            <div key={item.id} className="flex gap-3 p-3">
              <div className="shrink-0 mt-0.5">
                {item.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : item.impact === 'high' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', item.passed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white')}>
                  {item.label}
                </p>
                {item.suggestion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.suggestion}</p>
                )}
              </div>
              <Badge
                variant={item.impact === 'high' ? 'destructive' : item.impact === 'medium' ? 'warning' : 'secondary'}
                className="shrink-0 text-[10px] h-5"
              >
                {item.impact}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ATSSystemCard({ system }: { system: PerATSScore }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="text-right shrink-0 w-12">
        <span className={cn(
          'text-base font-black',
          system.score >= 80 ? 'text-green-600 dark:text-green-400' :
          system.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
        )}>
          {system.score}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{system.atsName}</p>
        <Progress value={system.score} className="h-1.5 mt-1" />
        {system.criticalIssues.length > 0 && (
          <p className="text-[10px] text-red-500 mt-1 truncate">{system.criticalIssues[0]}</p>
        )}
      </div>
    </div>
  );
}

export function ATSScorePanel({ score }: ATSScorePanelProps) {
  const [showAllATS, setShowAllATS] = useState(false);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'ats-systems' | 'keywords'>('dimensions');

  const visibleATS = showAllATS ? score.perATS : score.perATS.slice(0, 6);

  const dimensions = [
    score.dimensions.keywordMatch,
    score.dimensions.formatCompliance,
    score.dimensions.sectionCompleteness,
    score.dimensions.achievementQuality,
    score.dimensions.contactMeta,
    score.dimensions.lengthDensity,
  ];

  return (
    <div className="space-y-4">
      {/* Score Hero */}
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <GradeRing grade={score.grade} total={score.total} />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {score.total >= 90 ? '🎉 Excellent! Your resume is ATS-optimized.' :
               score.total >= 75 ? '👍 Good score! A few improvements will push you higher.' :
               score.total >= 60 ? '⚠️ Moderate. Address the red items to significantly improve.' :
               '🚨 Low score. Follow the suggestions to avoid automatic rejection.'}
            </p>
            {score.missingKeywords.length > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {score.missingKeywords.length} required keywords missing from JD
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {[
          { id: 'dimensions', label: 'Score Breakdown' },
          { id: 'ats-systems', label: `Per ATS (${score.perATS.length})` },
          { id: 'keywords', label: 'Keywords' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex-1 rounded-md px-2 py-2 text-xs font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white shadow text-gray-900 dark:bg-gray-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dimensions */}
      {activeTab === 'dimensions' && (
        <div className="space-y-2">
          {dimensions.map(dim => (
            <DimensionCard key={dim.name} dim={dim} />
          ))}
        </div>
      )}

      {/* Per ATS */}
      {activeTab === 'ats-systems' && (
        <div className="space-y-2">
          {visibleATS.map(system => (
            <ATSSystemCard key={system.atsName} system={system} />
          ))}
          {score.perATS.length > 6 && (
            <button
              onClick={() => setShowAllATS(!showAllATS)}
              className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline py-1"
            >
              {showAllATS ? 'Show less' : `Show all ${score.perATS.length} ATS systems`}
            </button>
          )}
        </div>
      )}

      {/* Keywords */}
      {activeTab === 'keywords' && (
        <div className="space-y-3">
          {score.missingKeywords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Missing Required Keywords ({score.missingKeywords.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {score.missingKeywords.map(kw => (
                  <span key={kw} className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-0.5 text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Found Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {score.extractedKeywords
                .filter(k => k.found)
                .map(k => (
                  <span key={k.keyword} className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-0.5 text-xs font-medium">
                    {k.keyword} ×{k.frequency}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
