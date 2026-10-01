from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
