import type { ResumeData } from '@/types/resume';

export async function exportDOCX(resume: ResumeData): Promise<void> {
  const docxLib = await import('docx');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = docxLib;
  type DocxParagraph = InstanceType<typeof Paragraph>;
  const { contact, summary, experience, education, skills, certifications, projects } = resume;

  const DIVIDER = new Paragraph({
    border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { after: 100 },
  });

  const sectionHeading = (text: string) =>
    new Paragraph({
      text: text.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
    });

  const children: DocxParagraph[] = [];

  // Name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: contact.name, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
    })
  );

  // Contact line
  const contactParts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github]
    .filter(Boolean).join(' | ');
  children.push(
    new Paragraph({
      children: [new TextRun({ text: contactParts, size: 20, color: '333333' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Summary
  if (summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(new Paragraph({ children: [new TextRun({ text: summary, size: 22 })], spacing: { after: 100 } }));
  }

  // Experience
  if (experience.length > 0) {
    children.push(sectionHeading('Work Experience'));
    for (const exp of experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22 }),
            new TextRun({ text: `  |  ${exp.startDate} - ${exp.endDate}`, size: 22, color: '555555' }),
          ],
          spacing: { before: 150, after: 0 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company, italics: true, size: 20 }),
            exp.location ? new TextRun({ text: `  |  ${exp.location}`, size: 20, color: '777777' }) : new TextRun({ text: '' }),
          ],
          spacing: { after: 80 },
        })
      );
      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: bullet, size: 20 })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  // Education
  if (education.length > 0) {
    children.push(sectionHeading('Education'));
    for (const edu of education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree}${edu.field ? ' in ' + edu.field : ''}`, bold: true, size: 22 }),
            new TextRun({ text: `  |  ${edu.endDate}`, size: 22, color: '555555' }),
          ],
          spacing: { before: 100, after: 0 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.institution, size: 20 }),
            edu.gpa ? new TextRun({ text: `  |  GPA: ${edu.gpa}`, size: 20 }) : new TextRun({ text: '' }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  // Skills
  if (skills.length > 0) {
    children.push(sectionHeading('Skills'));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: skills.join(' • '), size: 20 })],
        spacing: { after: 100 },
      })
    );
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    children.push(sectionHeading('Certifications'));
    for (const cert of certifications) {
      const text = typeof cert === 'string' ? cert : `${cert.name} — ${cert.issuer}${cert.date ? ', ' + cert.date : ''}`;
      children.push(new Paragraph({ children: [new TextRun({ text, size: 20 })], bullet: { level: 0 } }));
    }
  }

  // Projects
  if (projects && projects.length > 0) {
    children.push(sectionHeading('Projects'));
    for (const proj of projects) {
      if (typeof proj === 'string') {
        children.push(new Paragraph({ children: [new TextRun({ text: proj, size: 20 })], bullet: { level: 0 } }));
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.name, bold: true, size: 20 }),
              new TextRun({ text: `: ${proj.description}`, size: 20 }),
              proj.technologies?.length
                ? new TextRun({ text: ` (${proj.technologies.join(', ')})`, italics: true, size: 20 })
                : new TextRun({ text: '' }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contact.name.replace(/\s+/g, '_')}_Resume_ATS.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
