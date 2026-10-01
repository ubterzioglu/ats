"""Configuration for Resume Parser"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'
TEST_DIR = DATA_DIR / 'test'

# Create directories
for directory in [DATA_DIR, MODELS_DIR, TEST_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# spaCy model path
SPACY_MODEL = "en_core_web_sm"

# ATS scoring thresholds
ATS_THRESHOLDS = {
    'excellent': 90,
    'good': 75,
    'fair': 60,
    'poor': 0
}
