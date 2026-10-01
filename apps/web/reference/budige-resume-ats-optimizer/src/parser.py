"""
Resume Parser using Custom spaCy NER Model

Extracts structured information from resumes including contact info,
skills, education, and work experience.
"""

import spacy
import re
from typing import Dict, List, Optional
import PyPDF2
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResumeParser:
    """Parse resumes and extract structured information"""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize parser with spaCy model
        
        Args:
            model_path: Path to custom NER model (uses default if None)
        """
        if model_path and Path(model_path).exists():
            self.nlp = spacy.load(model_path)
        else:
            # Use base model for demonstration
            self.nlp = spacy.load("en_core_web_sm")
        
        # Common skill patterns
        self.skills_keywords = {
            'programming': ['python', 'java', 'javascript', 'c++', 'r', 'sql', 'c#'],
            'data': ['pandas', 'numpy', 'tensorflow', 'pytorch', 'spark', 'hadoop'],
            'tools': ['git', 'docker', 'kubernetes', 'jenkins', 'aws', 'azure', 'gcp'],
            'analytics': ['tableau', 'power bi', 'excel', 'sas', 'stata', 'spss'],
            'databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite'],
            'methodologies': ['agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd']
        }
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return ""
    
    def extract_contact_info(self, text: str) -> Dict[str, str]:
        """
        Extract contact information using regex patterns
        
        Args:
            text: Resume text
            
        Returns:
            Dictionary with contact details
        """
        contact = {
            'email': None,
            'phone': None,
            'linkedin': None,
            'github': None
        }
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact['email'] = email_match.group()
        
        # Phone pattern (various formats)
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                contact['phone'] = phone_match.group()
                break
        
        # LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin_match:
            contact['linkedin'] = linkedin_match.group()
        
        # GitHub
        github_pattern = r'github\.com/[\w-]+'
        github_match = re.search(github_pattern, text, re.IGNORECASE)
        if github_match:
            contact['github'] = github_match.group()
        
        return contact
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract technical and soft skills
        
        Args:
            text: Resume text
            
        Returns:
            List of identified skills
        """
        text_lower = text.lower()
        skills = set()
        
        # Check against known skill keywords
        for category, keywords in self.skills_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    skills.add(keyword.title())
        
        # Use spaCy for additional entity extraction
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT']:  # Often captures tools/technologies
                potential_skill = ent.text.strip()
                if len(potential_skill) > 2 and len(potential_skill) < 30:
                    skills.add(potential_skill)
        
        return sorted(list(skills))
    
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """
        Extract education information
        
        Args:
            text: Resume text
            
        Returns:
            List of education records
        """
        education = []
        
        # Common degree patterns
        degree_patterns = [
            r'(Bachelor|Master|PhD|B\.S\.|M\.S\.|Ph\.D\.|BS|MS)\s+(?:of\s+)?(?:Science|Arts|Engineering|Computer Science|Business|in\s+[\w\s]+)',
            r'(Associate|Diploma)\s+(?:of\s+)?[\w\s]+'
        ]
        
        for pattern in degree_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                education.append({
                    'degree': match.group(),
                    'details': self._extract_education_context(text, match.start(), match.end())
                })
        
        return education
    
    def _extract_education_context(self, text: str, start: int, end: int) -> str:
        """Extract surrounding context for education entry"""
        # Get 200 characters before and after the degree mention
        context_start = max(0, start - 200)
        context_end = min(len(text), end + 200)
        context = text[context_start:context_end]
        return context.strip()
    
    def extract_experience(self, text: str) -> List[Dict[str, any]]:
        """
        Extract work experience
        
        Args:
            text: Resume text
            
        Returns:
            List of experience records
        """
        experience = []
        
        # Split text into sections
        sections = re.split(r'\n\s*\n', text)
        
        for section in sections:
            # Look for job title patterns
            job_title_patterns = [
                r'(Engineer|Analyst|Developer|Manager|Director|Specialist|Consultant|Coordinator)',
                r'(Senior|Junior|Lead|Principal|Staff|Chief)\s+\w+'
            ]
            
            for pattern in job_title_patterns:
                if re.search(pattern, section, re.IGNORECASE):
                    # Extract company name (usually after "at" or before dates)
                    company_pattern = r'at\s+([\w\s&,.]+?)(?:\||•|\n|20\d{2})'
                    company_match = re.search(company_pattern, section, re.IGNORECASE)
                    
                    experience.append({
                        'section_text': section[:200],  # First 200 chars
                        'has_job_title': True,
                        'company': company_match.group(1) if company_match else None
                    })
                    break
        
        return experience[:5]  # Return top 5 most likely experiences
    
    def parse(self, file_path: str) -> Dict[str, any]:
        """
        Main parsing function
        
        Args:
            file_path: Path to resume file (PDF or TXT)
            
        Returns:
            Structured resume data
        """
        logger.info(f"Parsing resume: {file_path}")
        
        # Extract text
        if file_path.endswith('.pdf'):
            text = self.extract_text_from_pdf(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        
        # Extract all components
        parsed_data = {
            'raw_text': text,
            'contact': self.extract_contact_info(text),
            'skills': self.extract_skills(text),
            'education': self.extract_education(text),
            'experience': self.extract_experience(text),
            'word_count': len(text.split()),
            'parsed_successfully': True
        }
        
        logger.info(f"Parsing complete. Found {len(parsed_data['skills'])} skills, "
                   f"{len(parsed_data['education'])} education entries, "
                   f"{len(parsed_data['experience'])} experience entries")
        
        return parsed_data


def main():
    """Demonstration of resume parsing"""
    
    # Create sample resume text
    sample_resume = """
    JOHN DOE
    john.doe@email.com | +1-555-123-4567 | linkedin.com/in/johndoe
    Chicago, IL
    
    SUMMARY
    Data Analyst with 3+ years of experience in Python, SQL, and data visualization.
    
    SKILLS
    Programming: Python, SQL, R, JavaScript
    Tools: Tableau, Power BI, Excel, Git
    Databases: PostgreSQL, MySQL, MongoDB
    
    EXPERIENCE
    Senior Data Analyst at Tech Corp
    January 2022 - Present
    • Analyzed customer behavior using Python and SQL
    • Built dashboards in Tableau serving 50+ stakeholders
    • Reduced reporting time by 40% through automation
    
    Data Analyst at StartupXYZ
    June 2020 - December 2021
    • Performed statistical analysis on marketing campaigns
    • Created predictive models with 85% accuracy
    
    EDUCATION
    Master of Science in Computer Science
    University of Illinois Springfield, 2020
    GPA: 3.8/4.0
    
    Bachelor of Science in Mathematics
    State University, 2018
    """
    
    # Save sample resume
    Path("data/test").mkdir(parents=True, exist_ok=True)
    with open("data/test/sample_resume.txt", 'w') as f:
        f.write(sample_resume)
    
    # Parse resume
    parser = ResumeParser()
    parsed = parser.parse("data/test/sample_resume.txt")
    
    # Print results
    print("\n=== Resume Parsing Results ===\n")
    print(f"Contact Information:")
    for key, value in parsed['contact'].items():
        if value:
            print(f"  {key.title()}: {value}")
    
    print(f"\nSkills ({len(parsed['skills'])}):")
    print(f"  {', '.join(parsed['skills'][:10])}")
    
    print(f"\nEducation ({len(parsed['education'])}):")
    for edu in parsed['education']:
        print(f"  • {edu['degree']}")
    
    print(f"\nExperience Sections: {len(parsed['experience'])}")
    print(f"Word Count: {parsed['word_count']}")


if __name__ == "__main__":
    main()
