import type { ResumeData } from '@/types/resume';

export function exportMarkdown(resume: ResumeData): void {
  const { contact, summary, experience, education, skills, certifications, projects } = resume;
  let md = '';

  md += `# ${contact.name}\n\n`;

  const contactParts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean);
  md += contactParts.join(' | ') + '\n\n';

  if (summary) {
    md += `## Professional Summary\n\n${summary}\n\n`;
  }

  if (experience.length > 0) {
    md += `## Work Experience\n\n`;
    for (const exp of experience) {
      md += `### ${exp.title} | ${exp.company}\n`;
      md += `*${exp.startDate} - ${exp.endDate}*${exp.location ? ` | ${exp.location}` : ''}\n\n`;
      for (const bullet of exp.bullets) {
        md += `- ${bullet}\n`;
      }
      md += '\n';
    }
  }

  if (education.length > 0) {
    md += `## Education\n\n`;
    for (const edu of education) {
      md += `### ${edu.degree}${edu.field ? ' in ' + edu.field : ''}\n`;
      md += `**${edu.institution}** | ${edu.endDate}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n\n`;
    }
  }

  if (skills.length > 0) {
    md += `## Skills\n\n${skills.join(', ')}\n\n`;
  }

  if (certifications && certifications.length > 0) {
    md += `## Certifications\n\n`;
    for (const cert of certifications) {
      const text = typeof cert === 'string' ? cert : `${cert.name} — ${cert.issuer}${cert.date ? ', ' + cert.date : ''}`;
      md += `- ${text}\n`;
    }
    md += '\n';
  }

  if (projects && projects.length > 0) {
    md += `## Projects\n\n`;
    for (const proj of projects) {
      if (typeof proj === 'string') {
        md += `- ${proj}\n`;
      } else {
        md += `### ${proj.name}\n${proj.description}${proj.technologies?.length ? '\n\n**Technologies:** ' + proj.technologies.join(', ') : ''}\n\n`;
      }
    }
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contact.name.replace(/\s+/g, '_')}_Resume.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
