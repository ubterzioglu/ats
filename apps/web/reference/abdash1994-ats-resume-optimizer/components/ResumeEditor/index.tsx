'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ResumeData, WorkExperience, Education } from '@/types/resume';

interface ResumeEditorProps {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
  missingKeywords?: string[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function ContactEditor({ resume, onChange }: { resume: ResumeData; onChange: (r: ResumeData) => void }) {
  const update = (field: keyof typeof resume.contact, value: string) => {
    onChange({ ...resume, contact: { ...resume.contact, [field]: value } });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
          <Input value={resume.contact.name} onChange={e => update('name', e.target.value)} placeholder="Your Name" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
          <Input value={resume.contact.email} onChange={e => update('email', e.target.value)} type="email" placeholder="you@email.com" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
          <Input value={resume.contact.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</label>
          <Input value={resume.contact.location} onChange={e => update('location', e.target.value)} placeholder="City, State" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">LinkedIn URL</label>
          <Input value={resume.contact.linkedin || ''} onChange={e => update('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">GitHub URL</label>
          <Input value={resume.contact.github || ''} onChange={e => update('github', e.target.value)} placeholder="github.com/yourname" className="mt-1" />
        </div>
      </div>
    </div>
  );
}

function SummaryEditor({ resume, onChange, missingKeywords }: { resume: ResumeData; onChange: (r: ResumeData) => void; missingKeywords?: string[] }) {
  return (
    <div className="space-y-2">
      {missingKeywords && missingKeywords.length > 0 && (
        <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg">
          💡 Try naturally including these keywords: {missingKeywords.slice(0, 4).join(', ')}
        </div>
      )}
      <Textarea
        value={resume.summary || ''}
        onChange={e => onChange({ ...resume, summary: e.target.value })}
        placeholder="Write a 2-4 sentence professional summary highlighting your top achievements and keywords from the job description..."
        className="min-h-[120px]"
      />
      <p className="text-xs text-gray-400">
        {(resume.summary || '').split(' ').filter(Boolean).length} words
        {(resume.summary || '').length < 50 && ' (aim for 50-150 words)'}
      </p>
    </div>
  );
}

function ExperienceCard({ exp, onUpdate, onDelete }: { exp: WorkExperience; onUpdate: (e: WorkExperience) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(true);

  const updateBullet = (i: number, value: string) => {
    const bullets = [...exp.bullets];
    bullets[i] = value;
    onUpdate({ ...exp, bullets });
  };

  const addBullet = () => {
    onUpdate({ ...exp, bullets: [...exp.bullets, ''] });
  };

  const deleteBullet = (i: number) => {
    const bullets = exp.bullets.filter((_, idx) => idx !== i);
    onUpdate({ ...exp, bullets });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
        <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {exp.title || 'Job Title'} {exp.company ? `at ${exp.company}` : ''}
          </p>
          <p className="text-xs text-gray-500">{exp.startDate} — {exp.endDate}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500">Job Title</label>
              <Input value={exp.title} onChange={e => onUpdate({ ...exp, title: e.target.value })} placeholder="Software Engineer" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company</label>
              <Input value={exp.company} onChange={e => onUpdate({ ...exp, company: e.target.value })} placeholder="Company Name" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Start Date</label>
              <Input value={exp.startDate} onChange={e => onUpdate({ ...exp, startDate: e.target.value })} placeholder="MM/YYYY" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">End Date</label>
              <Input value={exp.endDate} onChange={e => onUpdate({ ...exp, endDate: e.target.value })} placeholder="MM/YYYY or Present" className="mt-1 h-8 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Location (optional)</label>
            <Input value={exp.location || ''} onChange={e => onUpdate({ ...exp, location: e.target.value })} placeholder="City, State or Remote" className="mt-1 h-8 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Bullet Points</label>
              <span className="text-xs text-gray-400">{exp.bullets.length} bullets</span>
            </div>
            <div className="space-y-2">
              {exp.bullets.map((bullet, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-400 mt-2 text-sm">•</span>
                  <Textarea
                    value={bullet}
                    onChange={e => updateBullet(i, e.target.value)}
                    placeholder="Led/Built/Improved [what] resulting in [quantified impact]..."
                    className="min-h-[60px] text-sm flex-1"
                  />
                  <button onClick={() => deleteBullet(i)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400 self-start mt-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addBullet} className="gap-1 text-xs h-7">
                <Plus className="h-3 w-3" /> Add bullet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillsEditor({ resume, onChange, missingKeywords }: { resume: ResumeData; onChange: (r: ResumeData) => void; missingKeywords?: string[] }) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || resume.skills.includes(trimmed)) return;
    onChange({ ...resume, skills: [...resume.skills, trimmed] });
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    onChange({ ...resume, skills: resume.skills.filter(s => s !== skill) });
  };

  const addMissingKeyword = (kw: string) => {
    if (!resume.skills.includes(kw)) {
      onChange({ ...resume, skills: [...resume.skills, kw] });
    }
  };

  return (
    <div className="space-y-3">
      {missingKeywords && missingKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Add missing JD keywords to skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.slice(0, 10).map(kw => (
              <button
                key={kw}
                onClick={() => addMissingKeyword(kw)}
                disabled={resume.skills.includes(kw)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all',
                  resume.skills.includes(kw)
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
                )}
              >
                {resume.skills.includes(kw) ? '✓ ' : '+ '}{kw}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {resume.skills.map(skill => (
          <span
            key={skill}
            className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 text-xs font-medium"
          >
            {skill}
            <button onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSkill(newSkill)}
          placeholder="Add a skill (press Enter)"
          className="h-8 text-sm"
        />
        <Button variant="outline" size="sm" onClick={() => addSkill(newSkill)} className="h-8 px-3">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ResumeEditor({ resume, onChange, missingKeywords }: ResumeEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('contact');

  const sections = [
    { id: 'contact', label: 'Contact' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: `Experience (${resume.experience.length})` },
    { id: 'education', label: `Education (${resume.education.length})` },
    { id: 'skills', label: `Skills (${resume.skills.length})` },
  ];

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: generateId(),
      company: '',
      title: '',
      startDate: '',
      endDate: 'Present',
      bullets: [''],
    };
    onChange({ ...resume, experience: [...resume.experience, newExp] });
  };

  const updateExperience = (id: string, exp: WorkExperience) => {
    onChange({ ...resume, experience: resume.experience.map(e => e.id === id ? exp : e) });
  };

  const deleteExperience = (id: string) => {
    onChange({ ...resume, experience: resume.experience.filter(e => e.id !== id) });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      institution: '',
      degree: '',
      endDate: '',
    };
    onChange({ ...resume, education: [...resume.education, newEdu] });
  };

  return (
    <div className="space-y-4">
      {/* Section Nav */}
      <div className="flex gap-1 flex-wrap">
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              activeSection === sec.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        {activeSection === 'contact' && (
          <ContactEditor resume={resume} onChange={onChange} />
        )}

        {activeSection === 'summary' && (
          <SummaryEditor resume={resume} onChange={onChange} missingKeywords={missingKeywords} />
        )}

        {activeSection === 'experience' && (
          <div className="space-y-3">
            {resume.experience.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Edit3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No experience entries yet</p>
              </div>
            ) : (
              resume.experience.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  exp={exp}
                  onUpdate={updated => updateExperience(exp.id, updated)}
                  onDelete={() => deleteExperience(exp.id)}
                />
              ))
            )}
            <Button variant="outline" size="sm" onClick={addExperience} className="gap-1.5 w-full">
              <Plus className="h-4 w-4" /> Add Experience
            </Button>
          </div>
        )}

        {activeSection === 'education' && (
          <div className="space-y-3">
            {resume.education.map((edu, i) => (
              <div key={edu.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Education {i + 1}</p>
                  <button
                    onClick={() => onChange({ ...resume, education: resume.education.filter(e => e.id !== edu.id) })}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Degree</label>
                    <Input
                      value={edu.degree}
                      onChange={e => onChange({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, degree: e.target.value } : ed) })}
                      placeholder="Bachelor of Science"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Field of Study</label>
                    <Input
                      value={edu.field || ''}
                      onChange={e => onChange({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, field: e.target.value } : ed) })}
                      placeholder="Computer Science"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500">Institution</label>
                    <Input
                      value={edu.institution}
                      onChange={e => onChange({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, institution: e.target.value } : ed) })}
                      placeholder="University Name"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Graduation Year</label>
                    <Input
                      value={edu.endDate}
                      onChange={e => onChange({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, endDate: e.target.value } : ed) })}
                      placeholder="2022"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">GPA (optional)</label>
                    <Input
                      value={edu.gpa || ''}
                      onChange={e => onChange({ ...resume, education: resume.education.map(ed => ed.id === edu.id ? { ...ed, gpa: e.target.value } : ed) })}
                      placeholder="3.8"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addEducation} className="gap-1.5 w-full">
              <Plus className="h-4 w-4" /> Add Education
            </Button>
          </div>
        )}

        {activeSection === 'skills' && (
          <SkillsEditor resume={resume} onChange={onChange} missingKeywords={missingKeywords} />
        )}
      </div>
    </div>
  );
}
