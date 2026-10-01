\# ATS Resume Scanner



An AI-powered Applicant Tracking System (ATS) that analyzes resumes against job descriptions and provides match percentages, skill gap analysis, and improvement recommendations.



\## Features



\- 📄 Upload resumes (PDF, DOCX, TXT)

\- 🎯 Match percentage calculation

\- ✅ Matching skills identification

\- ❌ Missing skills detection

\- 💪 Strengths analysis

\- 📝 Personalized recommendations

\- 📥 Downloadable analysis reports

\- 🔄 Multiple job role support



\## Tech Stack



\- \*\*LLM\*\*: Ollama (Llama 3.2)

\- \*\*Vector Database\*\*: ChromaDB for job description storage

\- \*\*Embeddings\*\*: Sentence Transformers

\- \*\*Framework\*\*: LangChain

\- \*\*UI\*\*: Streamlit

\- \*\*Document Processing\*\*: PyPDF2, docx2txt

\- \*\*Language\*\*: Python 3.10+



\## Installation



\### Prerequisites



1\. Python 3.10 or higher

2\. Ollama installed (\[Download here](https://ollama.ai/download))



\### Setup



1\. Clone this repository



2\. Create virtual environment:

python -m venv venv

source venv/bin/activate # Linux/Mac

venv\\Scripts\\activate # Windows





3\. Install dependencies:

pip install -r requirements.txt





4\. Download Ollama model:

ollama pull llama3.2:3b





5\. Create vector database from job descriptions:

python create\_vectordb.py





\## Usage



1\. Start Ollama (if not running):

ollama serve





2\. Launch ATS Scanner:

streamlit run ats\_scanner.py



3\. Open browser to `http://localhost:8501`



4\. Select a job role, upload your resume, and click "Analyze"



\## Project Structure

ats-resume-scanner/

├── ats\_scanner.py # Main Streamlit application

├── create\_vectordb.py # Vector database creation

├── requirements.txt # Python dependencies

├── README.md # This file

├── data/ # Job descriptions

│ ├── job\_ai\_ml\_engineer.txt

│ ├── job\_data\_scientist.txt

│ ├── job\_python\_developer.txt

│ └── job\_prompt\_engineer.txt

└── chroma\_db/ # Vector database (auto-generated)





\## Adding New Job Descriptions



1\. Create a new text file in `data/` folder:

&nbsp;  - Name format: `job\_ROLE\_NAME.txt`

&nbsp;  - Example: `job\_full\_stack\_developer.txt`



2\. Include these sections in the job description:

&nbsp;  - Job Title

&nbsp;  - Key Responsibilities

&nbsp;  - Required Skills

&nbsp;  - Preferred Skills

&nbsp;  - Experience Level

&nbsp;  - Educational Qualifications



3\. Regenerate vector database:

python create\_vectordb.py





4\. Restart the application



\## How It Works



1\. \*\*Upload\*\*: User uploads resume (PDF/DOCX/TXT)

2\. \*\*Extract\*\*: Text extracted from document

3\. \*\*Retrieve\*\*: System fetches relevant job requirements from vector DB

4\. \*\*Analyze\*\*: LLM compares resume against job description

5\. \*\*Report\*\*: Match percentage + detailed feedback generated



\## Analysis Components



\- \*\*Match Percentage\*\*: 0-100% compatibility score

\- \*\*Matching Skills\*\*: Skills from resume that align with job

\- \*\*Missing Skills\*\*: Important job requirements not in resume

\- \*\*Strengths\*\*: Strong points in the candidate's profile

\- \*\*Recommendations\*\*: Specific actionable improvements



\## Use Cases



\- Job seekers optimizing resumes

\- Career counselors providing feedback

\- Recruiters quickly screening candidates

\- Students preparing for job applications

\- Career changers tailoring resumes



\## Screenshots



\*Add screenshots here after uploading to GitHub\*



\## Contributing



Contributions welcome! Please open an issue or submit a pull request.



\## Future Enhancements



\- \[ ] Multi-resume comparison

\- \[ ] Resume template generator

\- \[ ] Keyword highlighting

\- \[ ] Export to PDF report

\- \[ ] Historical analysis tracking



\## License



MIT License



\## Author



YOUR\_NAME

\[LinkedIn](YOUR\_LINKEDIN) | \[GitHub](YOUR\_GITHUB) | \[Portfolio](YOUR\_PORTFOLIO)



\## Acknowledgments



\- Built to help job seekers optimize their resumes

\- Uses 100% free and open-source tools

\- No API keys or paid services required











