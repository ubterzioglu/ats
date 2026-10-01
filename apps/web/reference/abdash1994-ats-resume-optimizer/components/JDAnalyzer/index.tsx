'use client';

import React, { useState } from 'react';
import { Briefcase, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { JobContext, RoleCategory, ExperienceLevel } from '@/types/resume';

interface JDAnalyzerProps {
  onAnalyze: (context: JobContext) => void;
  isAnalyzing?: boolean;
  initialContext?: JobContext | null;
}

const ROLE_OPTIONS = [
  { value: 'software-engineering', label: 'Software Engineering' },
  { value: 'data-science', label: 'Data Science / ML / AI' },
  { value: 'product-management', label: 'Product Management' },
  { value: 'design', label: 'Design (UX/UI)' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'marketing', label: 'Marketing & Growth' },
  { value: 'sales', label: 'Sales & Business Development' },
  { value: 'hr', label: 'HR & People Ops' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'healthcare', label: 'Healthcare & Clinical' },
  { value: 'operations', label: 'Operations & Supply Chain' },
  { value: 'customer-success', label: 'Customer Success' },
  { value: 'other', label: 'Other' },
];

const LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry Level (0-1 years)' },
  { value: 'junior', label: 'Junior (1-3 years)' },
  { value: 'mid', label: 'Mid-Level (3-6 years)' },
  { value: 'senior', label: 'Senior (6-10 years)' },
  { value: 'staff', label: 'Staff / Principal (10+ years)' },
  { value: 'director', label: 'Director / Head of' },
  { value: 'vp', label: 'VP / SVP' },
  { value: 'c-suite', label: 'C-Suite (CTO, CPO, etc.)' },
];

export function JDAnalyzer({ onAnalyze, isAnalyzing, initialContext }: JDAnalyzerProps) {
  const [role, setRole] = useState(initialContext?.role || '');
  const [roleCategory, setRoleCategory] = useState<RoleCategory>(initialContext?.roleCategory || 'software-engineering');
  const [level, setLevel] = useState<ExperienceLevel>(initialContext?.experienceLevel || 'mid');
  const [years, setYears] = useState(String(initialContext?.yearsOfExperience || ''));
  const [jd, setJD] = useState(initialContext?.jobDescription || '');
  const [showTips, setShowTips] = useState(false);

  const handleSubmit = () => {
    if (!role.trim() || !jd.trim()) return;
    onAnalyze({
      role: role.trim(),
      roleCategory,
      experienceLevel: level,
      yearsOfExperience: parseInt(years) || 0,
      jobDescription: jd.trim(),
    });
  };

  const wordCount = jd.trim().split(/\s+/).filter(Boolean).length;
  const isReady = role.trim().length > 0 && jd.trim().length > 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Job Title *
          </label>
          <Input
            placeholder="e.g. Senior Software Engineer"
            value={role}
            onChange={e => setRole(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Role Category *
          </label>
          <Select
            options={ROLE_OPTIONS}
            value={roleCategory}
            onChange={e => setRoleCategory(e.target.value as RoleCategory)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Experience Level *
          </label>
          <Select
            options={LEVEL_OPTIONS}
            value={level}
            onChange={e => setLevel(e.target.value as ExperienceLevel)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Years of Experience
          </label>
          <Input
            type="number"
            placeholder="e.g. 5"
            min="0"
            max="40"
            value={years}
            onChange={e => setYears(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Job Description *
          </label>
          <span className={`text-xs ${wordCount > 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {wordCount} words {wordCount > 50 ? '✓' : '(need 50+ for analysis)'}
          </span>
        </div>
        <Textarea
          placeholder="Paste the full job description here — the more complete, the better the ATS keyword matching..."
          value={jd}
          onChange={e => setJD(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!isReady || isAnalyzing}
          className="w-full h-12 text-base gap-2"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze & Score Resume'}
        </Button>

        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto transition-colors"
        >
          {showTips ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showTips ? 'Hide' : 'Show'} tips for better results
        </button>

        {showTips && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Tips for 90%+ ATS scores:</p>
            <ul className="space-y-1">
              {[
                'Paste the COMPLETE job description including all requirements sections',
                'Include nice-to-have/preferred sections too — they add bonus keywords',
                'Match the exact job title you\'re applying for',
                'Paste qualifications, responsibilities, AND about the company sections',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <span className="font-bold shrink-0">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
