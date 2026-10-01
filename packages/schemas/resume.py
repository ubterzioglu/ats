from typing import List, Optional
from pydantic import BaseModel, Field

class CandidateInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None

class Experience(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    achievements: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)

class Education(BaseModel):
    institution: str
    degree: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class Certification(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None

class Project(BaseModel):
    name: str
    description: Optional[str] = None
    url: Optional[str] = None

class ResumeDocument(BaseModel):
    metadata: dict = Field(default_factory=dict)
    candidate: CandidateInfo = Field(default_factory=CandidateInfo)
    summary: Optional[str] = None
    experience: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    raw_text: Optional[str] = None
