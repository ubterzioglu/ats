from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    resumes = relationship("Resume", back_populates="user")
    job_descriptions = relationship("JobDescription", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    version = Column(Integer, default=1)
    parsed_json = Column(JSON)
    raw_text = Column(Text)
    checksum = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="resumes")
    analysis_runs = relationship("AnalysisRun", back_populates="resume")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    raw_text = Column(Text)
    parsed_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="job_descriptions")
    analysis_runs = relationship("AnalysisRun", back_populates="job_description")

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"))
    engine_version = Column(String)
    scoring_config_version = Column(String)
    skill_taxonomy_version = Column(String)
    embedding_model = Column(String)
    llm_provider = Column(String)
    llm_model = Column(String)
    prompt_version = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    resume = relationship("Resume", back_populates="analysis_runs")
    job_description = relationship("JobDescription", back_populates="analysis_runs")
    score_components = relationship("ScoreComponent", back_populates="analysis_run")

class ScoreComponent(Base):
    __tablename__ = "score_components"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id"))
    component = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    evidence_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    analysis_run = relationship("AnalysisRun", back_populates="score_components")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    canonical_name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String)
    aliases_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SkillRelation(Base):
    __tablename__ = "skill_relations"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    related_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    relation_type = Column(String, nullable=False) # e.g., 'alias', 'related', 'child'

class SemanticEmbedding(Base):
    """
    Stores embeddings for both CV experiences/skills and Job Description requirements
    to perform fast semantic matching via pgvector.
    """
    __tablename__ = "semantic_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    # References to parent entities (can be nullable depending on what it belongs to)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    
    content_text = Column(Text, nullable=False) # The raw string being embedded
    content_type = Column(String) # e.g. 'cv_experience', 'jd_requirement'
    
    # Use standard 1536 (OpenAI) or 4096 (Ollama llama3), 384 for embeddinggemma etc.
    # We will assume a flexible or common size, e.g., 4096 for Llama3 embeddings
    embedding = Column(Vector(4096))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
