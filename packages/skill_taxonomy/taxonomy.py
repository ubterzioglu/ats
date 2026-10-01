from typing import Dict, List, Optional
from pydantic import BaseModel

class SkillNode(BaseModel):
    canonical_name: str
    category: str
    aliases: List[str] = []
    parents: List[str] = []
    children: List[str] = []
    related: List[str] = []

class SkillTaxonomy:
    """
    In-memory representation of the Skill Taxonomy.
    Matches the requirements of Section 13 (Layer 2 Matching).
    """
    def __init__(self):
        # Maps lowercase skill names/aliases to their canonical SkillNode
        self._index: Dict[str, SkillNode] = {}
        self._skills: Dict[str, SkillNode] = {}
        
        # Load a default stub taxonomy for testing
        self._load_stub_data()
        
    def _load_stub_data(self):
        # Example from Technical Plan
        java = SkillNode(
            canonical_name="Java",
            category="Programming Language",
            children=["Java 8", "Java 11", "Java 17", "Java 21", "JVM", "Spring", "Spring Boot"]
        )
        selenium = SkillNode(
            canonical_name="Selenium",
            category="Testing",
            aliases=["Selenium WebDriver", "Selenium Grid", "WebDriver"],
            related=["Playwright", "Cypress"]
        )
        
        self.add_skill(java)
        self.add_skill(selenium)
        
    def add_skill(self, skill: SkillNode):
        self._skills[skill.canonical_name.lower()] = skill
        self._index[skill.canonical_name.lower()] = skill
        for alias in skill.aliases:
            self._index[alias.lower()] = skill

    def normalize(self, term: str) -> Optional[str]:
        """
        Takes an arbitrary skill string and returns the canonical name if found in the taxonomy.
        e.g., "Selenium WebDriver" -> "Selenium"
        """
        node = self._index.get(term.lower().strip())
        if node:
            return node.canonical_name
        return None
        
    def get_related(self, term: str) -> List[str]:
        """
        Returns related skills, children, and parents to broaden matching scope.
        """
        node = self._index.get(term.lower().strip())
        if not node:
            return []
            
        expansion = set(node.related + node.children + node.parents)
        return list(expansion)

# Singleton instance for the app
taxonomy_engine = SkillTaxonomy()
