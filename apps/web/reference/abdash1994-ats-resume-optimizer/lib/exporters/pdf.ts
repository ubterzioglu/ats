import type { ResumeData } from '@/types/resume';

function buildATSSafeHTML(resume: ResumeData): string {
  const { contact, summary, experience, education, skills, certifications, projects } = resume;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.4; padding: 0.75in; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; }
  .contact { text-align: center; font-size: 10pt; margin: 4px 0 12px; }
  h2 { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #000; margin: 12px 0 6px; text-transform: uppercase; }
  .exp-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 8px; }
  .exp-sub { display: flex; justify-content: space-between; color: #333; margin-bottom: 4px; }
  ul { margin-left: 16px; }
  li { margin: 2px 0; }
  .skills-list { line-height: 1.8; }
  .edu-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 8px; }
</style></head><body>`;

  // Name
  html += `<h1>${contact.name}</h1>`;

  // Contact
  const contactParts = [contact.email, contact.phone, contact.location];
  if (contact.linkedin) contactParts.push(contact.linkedin);
  if (contact.github) contactParts.push(contact.github);
  html += `<div class="contact">${contactParts.filter(Boolean).join(' | ')}</div>`;

  // Summary
  if (summary) {
    html += `<h2>Professional Summary</h2><p>${summary}</p>`;
  }

  // Experience
  if (experience.length > 0) {
    html += `<h2>Work Experience</h2>`;
    for (const exp of experience) {
      html += `<div class="exp-header"><span>${exp.title}</span><span>${exp.startDate} - ${exp.endDate}</span></div>`;
      html += `<div class="exp-sub"><span>${exp.company}</span>${exp.location ? `<span>${exp.location}</span>` : ''}</div>`;
      if (exp.bullets.length > 0) {
        html += `<ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      }
    }
  }

  // Education
  if (education.length > 0) {
    html += `<h2>Education</h2>`;
    for (const edu of education) {
      html += `<div class="edu-header"><span>${edu.degree}${edu.field ? ' in ' + edu.field : ''}</span><span>${edu.endDate}</span></div>`;
      html += `<div>${edu.institution}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}</div>`;
    }
  }

  // Skills
  if (skills.length > 0) {
    html += `<h2>Skills</h2><div class="skills-list">${skills.join(' • ')}</div>`;
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    html += `<h2>Certifications</h2><ul>`;
    for (const cert of certifications) {
      const name = typeof cert === 'string' ? cert : `${cert.name} — ${cert.issuer}${cert.date ? ', ' + cert.date : ''}`;
      html += `<li>${name}</li>`;
    }
    html += `</ul>`;
  }

  // Projects
  if (projects && projects.length > 0) {
    html += `<h2>Projects</h2><ul>`;
    for (const proj of projects) {
      if (typeof proj === 'string') {
        html += `<li>${proj}</li>`;
      } else {
        html += `<li><strong>${proj.name}</strong>: ${proj.description}${proj.technologies?.length ? ' (' + proj.technologies.join(', ') + ')' : ''}</li>`;
      }
    }
    html += `</ul>`;
  }

  html += `</body></html>`;
  return html;
}

export async function exportPDF(resume: ResumeData): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;

  const htmlContent = buildATSSafeHTML(resume);
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const opt = {
    margin: 0,
    filename: `${resume.contact.name.replace(/\s+/g, '_')}_Resume_ATS.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
  };

  try {
    await html2pdf().set(opt).from(container.querySelector('body') || container).save();
  } finally {
    document.body.removeChild(container);
  }
}

export function getResumeHTML(resume: ResumeData): string {
  return buildATSSafeHTML(resume);
}
