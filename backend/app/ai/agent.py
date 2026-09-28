import re
from typing import Dict, Any, List, Optional
from app.ai.tools import (
    tool_tax_calculator, tool_regime_comparison, tool_capital_gains_calculator,
    tool_salary_tax_calculator, tool_tax_rule_search, tool_document_search,
    tool_tds_calculator, tool_tax_scenario_simulator
)
from app.ai.llm_provider import get_llm_provider

class TaxReasoningAgent:
    def __init__(self):
        self.llm = get_llm_provider()

    def process_query(self, user_query: str, financial_year: str = "2024-25", chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        q_lower = user_query.lower()
        tool_results = []
        audit_trail = []
        
        audit_trail.append(f"Received user query: '{user_query}' for FY {financial_year}.")
        
        # 1. Multi-turn Memory Aggregation
        combined_text = user_query
        if chat_history:
            past_queries = [m["text"] for m in chat_history if m.get("sender") == "user"]
            combined_text = " ".join(past_queries) + " " + user_query
            audit_trail.append(f"Retained conversation context across {len(past_queries)} past user turn(s).")

        c_lower = combined_text.lower()

        # 2. Financial Year Extraction
        if "2023-24" in combined_text or "23-24" in combined_text or "ay 24-25" in c_lower:
            financial_year = "2023-24"
        elif "2025-26" in combined_text or "25-26" in combined_text or "ay 26-27" in c_lower:
            financial_year = "2025-26"

        # 3. Cumulative Parameter Extraction
        salary = self._extract_amount(c_lower, ["salary", "earn", "income", "lakh", "lac", "l"])
        sec_80c = self._extract_amount(c_lower, ["80c", "ppf", "elss", "epf"])
        sec_80d = self._extract_amount(c_lower, ["80d", "health", "insurance", "mediclaim"])
        sec_24b = self._extract_amount(c_lower, ["24b", "home loan", "interest", "housing loan"])
        sec_nps = self._extract_amount(c_lower, ["nps", "80ccd"])
        
        is_capital_gains = any(w in c_lower for w in ["sold", "bought", "shares", "capital gains", "ltcg", "stcg", "property", "mutual fund"])
        is_comparison = any(w in c_lower for w in ["which regime", "compare", "old vs new", "better regime", "evaluate", "save"]) or (salary > 0)
        
        # 4. Capital Gains Scenario Dispatch
        if is_capital_gains:
            m_sold = re.search(r'(?:sold|sale|selling)\s*(?:shares|property|stocks|for)?\s*(?:for|at)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)?', c_lower)
            m_bought = re.search(r'(?:bought|purchased|purchase|cost)\s*(?:for|at)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)?', c_lower)
            
            sale_price = 0.0
            purchase_price = 0.0
            
            if m_sold:
                val = float(m_sold.group(1))
                sale_price = val * 100000.0 if val < 1000 else val
            if m_bought:
                val = float(m_bought.group(1))
                purchase_price = val * 100000.0 if val < 1000 else val
                
            if sale_price == 0.0:
                sale_price = self._extract_amount(c_lower, ["sold", "sale"])
            if purchase_price == 0.0:
                purchase_price = self._extract_amount(c_lower, ["bought", "purchased"])

            if sale_price > 0 and purchase_price > 0:
                asset_type = "equity" if any(w in c_lower for w in ["shares", "stocks", "mutual fund", "equity"]) else "real_estate"
                cg_out = tool_capital_gains_calculator(
                    financial_year=financial_year,
                    asset_type=asset_type,
                    sale_price=sale_price,
                    purchase_price=purchase_price
                )
                tool_results.append({"tool_name": "capital_gains_calculator", "output": cg_out})
                audit_trail.append(f"Executed Capital Gains Tool: {asset_type.upper()} Sale ₹{sale_price:,.0f}, Purchase ₹{purchase_price:,.0f}.")
        
        # 5. Deterministic Tax Engine Dispatch
        if is_comparison and salary > 0:
            comp_out = tool_regime_comparison(
                financial_year=financial_year,
                salary=salary,
                sec_80c=sec_80c,
                sec_80d=sec_80d,
                sec_24b=sec_24b,
                sec_80ccd_1b=sec_nps
            )
            tool_results.append({"tool_name": "regime_comparison", "output": comp_out})
            audit_trail.append(f"Executed Deterministic Tax Engine: Salary ₹{salary:,.0f}, 80C ₹{sec_80c:,.0f}, 80D ₹{sec_80d:,.0f}, 24b ₹{sec_24b:,.0f}, NPS ₹{sec_nps:,.0f}.")
        
        # 6. RAG Knowledge Retrieval Dispatch
        context_docs = tool_tax_rule_search(user_query, financial_year=financial_year)
        audit_trail.append(f"Retrieved {len(context_docs)} official tax provisions from RAG knowledge base.")
        
        # 7. LLM Reasoning Synthesis
        system_prompt = (
            "You are TaxSaathi, India's most advanced AI Tax Reasoning Assistant. "
            "Provide accurate, clear, empathetic, structured tax advice. "
            "Always include financial year, regime recommendation, clear savings figure, and source citations."
        )
        response_text = self.llm.generate_response(system_prompt, user_query, context_docs, tool_results)
        
        return {
            "query": user_query,
            "financial_year": financial_year,
            "response": response_text,
            "tool_results": tool_results,
            "context_docs": context_docs,
            "audit_trail": audit_trail
        }

    def _extract_amount(self, text: str, keywords: List[str]) -> float:
        for kw in keywords:
            if kw in text:
                idx = text.find(kw)
                snippet = text[max(0, idx - 30):min(len(text), idx + 40)]
                
                m_lakh = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)\b', snippet)
                if m_lakh:
                    return float(m_lakh.group(1)) * 100000.0
                    
                m_num = re.search(r'(\d{5,8})', snippet)
                if m_num:
                    return float(m_num.group(1))
                    
        m_general = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)\b', text)
        if m_general:
            return float(m_general.group(1)) * 100000.0
            
        return 0.0

_agent_instance = None
def get_tax_agent() -> TaxReasoningAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = TaxReasoningAgent()
    return _agent_instance
