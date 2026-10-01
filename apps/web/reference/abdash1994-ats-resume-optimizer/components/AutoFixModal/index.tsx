'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle, Loader2, Edit3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ResumeData, JobContext } from '@/types/resume';

export type AutoFixType =
  | 'summary'
  | 'skills'
  | 'bullet'
  | 'keywords';

export interface AutoFixPayload {
  type: AutoFixType;
  title: string;
  description: string;
  generatedContent: string;
  currentContent?: string;
  suggestedSkills?: string[];
  resumeField?: string;
}

interface AutoFixModalProps {
  payload: AutoFixPayload | null;
  resume: ResumeData;
  jobContext: JobContext | null;
  proApiKey?: string;
  proProvider?: 'groq' | 'openai' | 'anthropic';
  onApply: (updated: ResumeData) => void;
  onClose: () => void;
}

export function AutoFixModal({
  payload,
  resume,
  jobContext,
  proApiKey,
  proProvider,
  onApply,
  onClose,
}: AutoFixModalProps) {
  const [editedContent, setEditedContent] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedSkills, setAppliedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!payload) return;
    setEditedContent(payload.generatedContent);
    setSelectedSkills(payload.suggestedSkills || []);
    setAppliedSkills(new Set());
  }, [payload]);

  if (!payload) return null;

  const handleLLMRewrite = async () => {
    if (!proApiKey || !proProvider || !jobContext) return;
    setIsGenerating(true);
    try {
      const { rewriteWithLLM } = await import('@/lib/resume-optimizer/rewriter');
      const missingKeywords = payload.suggestedSkills || [];
      const result = await rewriteWithLLM(
        {
          type: payload.type === 'summary' ? 'summary' : payload.type === 'skills' ? 'skills' : 'bullet',
          context: `Role: ${jobContext.role}, Level: ${jobContext.experienceLevel}, Years: ${jobContext.yearsOfExperience}`,
          existing: payload.currentContent || editedContent,
          keywords: missingKeywords,
        },
        proApiKey,
        proProvider
      );
      setEditedContent(result);
    } catch (err) {
      console.error('LLM rewrite failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    let updatedResume = { ...resume };

    if (payload.type === 'summary') {
      updatedResume = { ...updatedResume, summary: editedContent };
    } else if (payload.type === 'skills' || payload.type === 'keywords') {
      const newSkills = [...new Set([...resume.skills, ...selectedSkills])];
      updatedResume = { ...updatedResume, skills: newSkills };
    }

    onApply(updatedResume);
    onClose();
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const isSkills = payload.type === 'skills' || payload.type === 'keywords';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{payload.title}</p>
              <p className="text-xs text-gray-400">{payload.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isSkills ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Select keywords to add to your Skills section:
              </p>
              <div className="flex flex-wrap gap-2">
                {(payload.suggestedSkills || []).map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold border transition-all',
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300'
                    )}
                  >
                    {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                  </button>
                ))}
              </div>

              {resume.skills.length > 0 && (
                <div className="rounded-lg bg-gray-800/50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Current skills (will be kept):</p>
                  <p className="text-xs text-gray-400">{resume.skills.join(', ')}</p>
                </div>
              )}

              <div className="rounded-lg bg-blue-950/30 border border-blue-700/30 p-3">
                <p className="text-xs font-medium text-blue-300 mb-1">
                  Preview — new skills section:
                </p>
                <p className="text-xs text-gray-300">
                  {[...resume.skills, ...selectedSkills.filter(s => !resume.skills.includes(s))].join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit before applying:
                </p>
                {proApiKey && proProvider && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLLMRewrite}
                    disabled={isGenerating}
                    className="h-7 text-xs gap-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Rewrite with AI
                  </Button>
                )}
              </div>

              {payload.currentContent && (
                <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Current:</p>
                  <p className="text-xs text-gray-400 line-through leading-relaxed">{payload.currentContent}</p>
                </div>
              )}

              <Textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="min-h-[140px] bg-gray-800 border-gray-600 text-gray-100 text-sm focus:border-blue-500 leading-relaxed"
                placeholder="Edit the generated content..."
              />

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Edit3 className="h-3 w-3" />
                Edit freely — this is a draft. Fill in placeholders like [quantify: X%] with your real numbers.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-700 bg-gray-800/30">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleApply}
            disabled={isSkills ? selectedSkills.length === 0 : !editedContent.trim()}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="h-4 w-4" />
            Apply & Rescore
          </Button>
        </div>
      </div>
    </div>
  );
}
