import streamlit as st
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaLLM
import os
import tempfile
import PyPDF2
import docx2txt
from io import BytesIO

# Page configuration
st.set_page_config(
    page_title="ATS Resume Scanner",
    page_icon="📄",
    layout="wide"
)

# Title
st.title("📄 ATS Resume Scanner")
st.markdown("Upload your resume and get instant feedback on how well it matches job requirements!")
st.markdown("---")

# Initialize session state
if "vectordb" not in st.session_state:
    with st.spinner("Loading job descriptions database..."):
        embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        st.session_state.vectordb = Chroma(
            persist_directory="./chroma_db",
            embedding_function=embeddings
        )

if "llm" not in st.session_state:
    with st.spinner("Initializing AI model..."):
        st.session_state.llm = OllamaLLM(
            model="llama3.2:3b",
            temperature=0.3,
        )

# Helper function to extract text from different file types
def extract_text_from_file(uploaded_file):
    """Extract text from PDF, DOCX, or TXT files"""
    file_type = uploaded_file.name.split('.')[-1].lower()
    
    if file_type == 'pdf':
        # Extract from PDF
        pdf_reader = PyPDF2.PdfReader(BytesIO(uploaded_file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    
    elif file_type == 'docx':
        # Extract from DOCX
        return docx2txt.process(BytesIO(uploaded_file.read()))
    
    elif file_type == 'txt':
        # Extract from TXT
        return uploaded_file.read().decode('utf-8')
    
    else:
        return None

# Function to calculate ATS score
def calculate_ats_score(resume_text, job_requirements):
    """Calculate match percentage using LLM analysis"""
    
    prompt = f"""You are an ATS (Applicant Tracking System) analyzer. Compare the resume against the job requirements and provide a detailed analysis.

JOB REQUIREMENTS:
{job_requirements}

RESUME:
{resume_text}

Provide your analysis in this EXACT format:

MATCH PERCENTAGE: [Give a number between 0-100]

MATCHING SKILLS:
- [List skills from resume that match job requirements]

MISSING SKILLS:
- [List important skills from job requirements not found in resume]

STRENGTHS:
- [List strong points in the resume]

RECOMMENDATIONS:
- [Suggest specific improvements]

Be precise and analytical. The match percentage should reflect how well the candidate fits the role."""

    response = st.session_state.llm.invoke(prompt)
    return response

# Function to extract keywords from job description
def extract_key_requirements(job_desc_text):
    """Extract key requirements from job description using retrieval"""
    relevant_chunks = st.session_state.vectordb.similarity_search(
        "skills requirements qualifications", 
        k=5
    )
    combined_requirements = "\n".join([chunk.page_content for chunk in relevant_chunks])
    return combined_requirements

# Sidebar
with st.sidebar:
    st.header("📋 Job Selection")
    
    # List available job descriptions
    data_folder = "data/"
    job_files = [f for f in os.listdir(data_folder) if f.endswith('.txt') and f.startswith('job_')]
    
    if job_files:
        selected_job = st.selectbox(
            "Select Job Description:",
            job_files,
            format_func=lambda x: x.replace('job_', '').replace('.txt', '').replace('_', ' ').title()
        )
        
        # Load selected job description
        with open(os.path.join(data_folder, selected_job), 'r', encoding='utf-8') as f:
            job_description = f.read()
        
        with st.expander("📄 View Job Description"):
            st.text_area("", job_description, height=300, disabled=True)
    else:
        st.warning("No job descriptions found in data/ folder!")
        job_description = None
    
    st.markdown("---")
    st.markdown("### 💡 Tips")
    st.info("""
    **For best results:**
    - Use PDF or DOCX format
    - Include clear sections
    - List skills explicitly
    - Mention technologies used
    - Include project details
    """)

# Main content area
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📤 Upload Your Resume")
    
    uploaded_file = st.file_uploader(
        "Choose your resume file",
        type=['pdf', 'docx', 'txt'],
        help="Supported formats: PDF, DOCX, TXT"
    )
    
    if uploaded_file:
        st.success(f"✅ File uploaded: {uploaded_file.name}")
        
        # Extract text
        with st.spinner("Extracting text from resume..."):
            resume_text = extract_text_from_file(uploaded_file)
        
        if resume_text:
            st.text_area("📄 Extracted Resume Text (Preview):", resume_text[:500] + "...", height=200)
            
            # Analyze button
            if st.button("🔍 Analyze Resume", type="primary", use_container_width=True):
                if job_description:
                    with st.spinner("Analyzing resume against job requirements... This may take 30-60 seconds..."):
                        # Get job requirements
                        job_requirements = extract_key_requirements(job_description)
                        
                        # Calculate ATS score
                        analysis = calculate_ats_score(resume_text, job_requirements)
                        
                        # Store in session state
                        st.session_state.analysis_result = analysis
                        st.session_state.show_results = True
                else:
                    st.error("Please select a job description first!")
        else:
            st.error("Could not extract text from the file. Please try another format.")

with col2:
    st.subheader("📊 Analysis Results")
    
    if "show_results" in st.session_state and st.session_state.show_results:
        result = st.session_state.analysis_result
        
        # Display results
        st.markdown("### Analysis Report")
        st.markdown(result)
        
        # Download report
        st.download_button(
            label="📥 Download Full Report",
            data=result,
            file_name="ats_analysis_report.txt",
            mime="text/plain"
        )
    else:
        st.info("👆 Upload your resume and click 'Analyze Resume' to see results here")
        
        # Show example
        st.markdown("### 📋 What You'll Get:")
        st.markdown("""
        - **Match Percentage**: Overall compatibility score
        - **Matching Skills**: Skills you have that match the job
        - **Missing Skills**: Important skills you should add
        - **Strengths**: What stands out in your resume
        - **Recommendations**: Specific improvements to make
        """)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center'>
    <p>💡 <b>Pro Tip:</b> Aim for 70%+ match for better chances. Update your resume based on recommendations!</p>
</div>
""", unsafe_allow_html=True)
