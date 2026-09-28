import os
from typing import Dict, Any, List, Optional

class LLMProvider:
    def __init__(self, provider: str = "auto"):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.provider = provider

    def generate_response(self, system_prompt: str, user_prompt: str, context_docs: List[Dict[str, Any]] = None, tool_results: List[Dict[str, Any]] = None) -> str:
        # Check if Gemini key is available
        if self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                full_prompt = f"System: {system_prompt}\nContext Documents: {context_docs}\nTool Outputs: {tool_results}\nUser Question: {user_prompt}"
                response = model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                print(f"Gemini API call failed, falling back to reasoning engine: {e}")

        # Deterministic Tax Reasoning Synthesis
        return self._fallback_synthesis(user_prompt, context_docs, tool_results)

    def _fallback_synthesis(self, user_prompt: str, context_docs: List[Dict[str, Any]], tool_results: List[Dict[str, Any]]) -> str:
        text = []
        text.append("### 🏛️ Indian Tax Reasoning & Assessment Summary\n")
        
        if tool_results:
            for tr in tool_results:
                tool_name = tr.get("tool_name", "Tool")
                data = tr.get("output", {})
                
                if tool_name in ["tax_calculator", "regime_comparison"]:
                    if "old_regime" in data and "new_regime" in data:
                        old_t = data["old_regime"]
                        new_t = data["new_regime"]
                        rec = data.get("recommended_regime", "new").upper()
                        savings = data.get("tax_savings", 0.0)
                        
                        text.append(f"**Financial Year**: {data.get('financial_year', '2024-25')} (AY {data.get('assessment_year', '2025-26')})")
                        text.append(f"**Gross Total Income**: ₹{old_t.get('gross_total_income', 0):,.2f}\n")
                        text.append("#### 📊 Regime Liability Comparison:")
                        text.append(f"- **Old Tax Regime**: Taxable Income ₹{old_t.get('taxable_income', 0):,.2f} ➔ **Total Tax: ₹{old_t.get('total_tax_liability', 0):,.2f}**")
                        text.append(f"- **New Tax Regime**: Taxable Income ₹{new_t.get('taxable_income', 0):,.2f} ➔ **Total Tax: ₹{new_t.get('total_tax_liability', 0):,.2f}**\n")
                        text.append(f"💡 **Recommendation**: **{rec} REGIME** is more beneficial. It saves you **₹{savings:,.2f}** in income tax.\n")
                    elif "total_tax_liability" in data:
                        regime = data.get("regime", "new").upper()
                        text.append(f"**Calculated Tax ({regime} Regime)**: ₹{data.get('total_tax_liability', 0):,.2f} on Taxable Income ₹{data.get('taxable_income', 0):,.2f}.\n")
                
                elif tool_name == "capital_gains_calculator":
                    asset = data.get("asset_type", "asset").upper()
                    gain_type = "LTCG" if data.get("is_ltcg") else "STCG"
                    rate = data.get("applicable_tax_rate", 0) * 100
                    tax = data.get("tax_amount", 0)
                    text.append(f"#### 📈 Capital Gains Breakdown ({asset}):")
                    text.append(f"- **Gain Category**: {gain_type} (Holding Period: {data.get('holding_months')} months)")
                    text.append(f"- **Gross Gain**: ₹{data.get('gross_gain', 0):,.2f}")
                    text.append(f"- **Exemption Applied**: ₹{data.get('exemption_applied', 0):,.2f}")
                    text.append(f"- **Taxable Gain**: ₹{data.get('taxable_gain', 0):,.2f} @ {rate}% = **Tax Payable: ₹{tax:,.2f}**\n")

        if context_docs:
            text.append("#### 📜 Official Legal Citations & Tax Provisions:")
            for doc in context_docs[:3]:
                sec = doc.get("section", "Section")
                name = doc.get("rule_name", "")
                desc = doc.get("description", "")
                source = doc.get("source", "Income Tax Department")
                url = doc.get("source_url", "https://incometaxindia.gov.in")
                text.append(f"- **[{sec}] {name}**\n  _{desc}_\n  *Source*: [{source}]({url}) | Effective: {doc.get('effective_from', 'N/A')}\n")

        text.append("\n> [!NOTE]\n> *Disclaimer: Calculations are based on deterministic tax rules under the Indian Income Tax Act. Please consult a Chartered Accountant (CA) for official return filings.*")
        return "\n".join(text)

_llm_instance = None
def get_llm_provider() -> LLMProvider:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMProvider()
    return _llm_instance
