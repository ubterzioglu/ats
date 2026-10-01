'use client';

import React from 'react';
import type { ResumeData } from '@/types/resume';

interface ResumePreviewProps {
  resume: ResumeData;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const { contact, summary, experience, education, skills, certifications, projects } = resume;

  return (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-lg">
      <div className="p-8 max-h-[70vh] overflow-y-auto text-sm leading-relaxed font-serif">
        {/* Name */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          {contact.name || 'Your Name'}
        </h1>

        {/* Contact line */}
        <div className="text-center text-gray-600 text-xs mb-4 flex flex-wrap justify-center gap-2">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <><span className="text-gray-300">|</span><span>{contact.phone}</span></>}
          {contact.location && <><span className="text-gray-300">|</span><span>{contact.location}</span></>}
          {contact.linkedin && <><span className="text-gray-300">|</span><span className="text-blue-600">{contact.linkedin}</span></>}
          {contact.github && <><span className="text-gray-300">|</span><span>{contact.github}</span></>}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Work Experience
            </h2>
            {experience.map(exp => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">{exp.title}</span>
                  <span className="text-gray-500 text-xs">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-gray-600 italic">{exp.company}</span>
                  {exp.location && <span className="text-gray-400 text-xs">{exp.location}</span>}
                </div>
                {exp.bullets.length > 0 ? (
                  <ul className="list-disc list-outside ml-4 space-y-0.5">
                    {exp.bullets.map((b, i) => (
                      <li key={i} className="text-gray-700">{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-400 italic text-xs">⚠ No bullets — add achievement-focused bullets</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Education
            </h2>
            {education.map(edu => (
              <div key={edu.id} className="flex justify-between items-baseline mb-1.5">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                  <span className="text-gray-600 ml-2">· {edu.institution}</span>
                  {edu.gpa && <span className="text-gray-400 ml-2">| GPA: {edu.gpa}</span>}
                </div>
                <span className="text-gray-500 text-xs">{edu.endDate}</span>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Skills
            </h2>
            <p className="text-gray-700">{skills.join(' · ')}</p>
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Certifications
            </h2>
            <ul className="list-disc list-outside ml-4 space-y-0.5">
              {certifications.map((cert, i) => (
                <li key={i} className="text-gray-700">
                  {typeof cert === 'string' ? cert : `${cert.name} — ${cert.issuer}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-0.5 mb-2 text-gray-800">
              Projects
            </h2>
            {projects.map((proj, i) => (
              <div key={i} className="mb-2">
                {typeof proj === 'string' ? (
                  <p className="text-gray-700">{proj}</p>
                ) : (
                  <>
                    <span className="font-bold text-gray-900">{proj.name}</span>
                    <span className="text-gray-600 ml-2">– {proj.description}</span>
                    {proj.technologies?.length && (
                      <span className="text-gray-400 text-xs ml-2">({proj.technologies.join(', ')})</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400">
          Preview only — download as DOCX or ATS-Safe PDF for submission
        </p>
      </div>
    </div>
  );
}
