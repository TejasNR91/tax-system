import json
import os
import re
from typing import List, Dict, Any, Optional

KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")

class TaxKnowledgeRetriever:
    def __init__(self, kb_path: str = KNOWLEDGE_BASE_PATH):
        self.kb_path = kb_path
        self.rules: List[Dict[str, Any]] = []
        self.load_knowledge_base()

    def load_knowledge_base(self):
        if os.path.exists(self.kb_path):
            with open(self.kb_path, "r", encoding="utf-8") as f:
                self.rules = json.load(f)
        else:
            self.rules = []

    def _tokenize(self, text: str) -> set:
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        return set(clean.split())

    def search(self, query: str, financial_year: str = "2024-25", category: Optional[str] = None, top_k: int = 3) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        scored_rules = []

        for rule in self.rules:
            # FY Filter check
            rule_fy = rule.get("financial_year", "2024-25")
            fy_bonus = 1.2 if rule_fy == financial_year or rule_fy == "Present" else 1.0
            
            # Category filter check
            cat_bonus = 1.3 if category and rule.get("category") == category else 1.0

            # Text content matching
            content = f"{rule.get('rule_name', '')} {rule.get('section', '')} {rule.get('description', '')} {' '.join(rule.get('key_provisions', []))}"
            rule_tokens = self._tokenize(content)

            overlap = len(query_tokens.intersection(rule_tokens))
            if overlap == 0:
                continue

            score = (overlap / (len(query_tokens) ** 0.5)) * fy_bonus * cat_bonus

            # Bonus for exact section mention e.g. "80C", "115BAC", "112A"
            for token in query_tokens:
                if token in rule.get("section", "").lower() or token in rule.get("id", "").lower():
                    score += 3.0

            scored_rules.append((score, rule))

        # Sort by score descending
        scored_rules.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scored_rules[:top_k]]
        return results

    def get_by_section(self, section: str) -> Optional[Dict[str, Any]]:
        clean_sec = section.strip().lower().replace(" ", "")
        for rule in self.rules:
            sec = rule.get("section", "").lower().replace(" ", "")
            rule_id = rule.get("id", "").lower()
            if clean_sec in sec or clean_sec in rule_id:
                return rule
        return None

_retriever_instance = None

def get_retriever() -> TaxKnowledgeRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = TaxKnowledgeRetriever()
    return _retriever_instance
