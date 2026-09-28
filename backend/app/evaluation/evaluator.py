import json
import os
from typing import Dict, Any, List
from app.ai.agent import get_tax_agent
from app.tax_engine.calculator import calculate_tax_for_regime, compare_regimes, calculate_capital_gains
from app.tax_engine.models import TaxInput, IncomeDetails, DeductionsDetails, CapitalGainsInput

SCENARIOS_PATH = os.path.join(os.path.dirname(__file__), "scenarios.json")

class TaxSystemEvaluator:
    def __init__(self, scenarios_file: str = SCENARIOS_PATH):
        self.scenarios_file = scenarios_file
        self.agent = get_tax_agent()

    def run_evaluations(self) -> Dict[str, Any]:
        if not os.path.exists(self.scenarios_file):
            return {"error": "Scenarios file not found"}
            
        with open(self.scenarios_file, "r") as f:
            scenarios = json.load(f)
            
        total_scenarios = len(scenarios)
        passed_calc = 0
        passed_retrieval = 0
        valid_citations = 0
        hallucinations = 0
        
        scenario_results = []
        
        for sc in scenarios:
            sc_id = sc["id"]
            fy = sc.get("financial_year", "2024-25")
            inp = sc.get("inputs", {})
            
            calc_success = False
            retrieval_success = False
            citation_success = False
            is_hallucination = False
            
            if "salary" in inp:
                t_input = TaxInput(
                    financial_year=fy,
                    incomes=IncomeDetails(salary=inp["salary"]),
                    deductions=DeductionsDetails(
                        sec_80c=inp.get("sec_80c", 0),
                        sec_80d_self=inp.get("sec_80d_self", 0),
                        sec_24b=inp.get("sec_24b", 0),
                        sec_80ccd_1b=inp.get("sec_80ccd_1b", 0)
                    )
                )
                comp_res = compare_regimes(t_input)
                
                # Verify recommended regime
                if "expected_recommended_regime" in sc:
                    if comp_res.recommended_regime == sc["expected_recommended_regime"]:
                        calc_success = True
                else:
                    calc_success = True

                # Agent Query Evaluation
                query_text = f"My annual salary is ₹{inp['salary']:,.0f} for FY {fy}. Deductions 80C ₹{inp.get('sec_80c', 0):,.0f}. Which tax regime is better?"
                agent_res = self.agent.process_query(query_text, financial_year=fy)
                
                # Retrieval accuracy check
                retrieved_sections = [d["section"] for d in agent_res["context_docs"]]
                expected_secs = sc.get("relevant_sections", [])
                if any(any(exp.lower() in r.lower() for r in retrieved_sections) for exp in expected_secs):
                    retrieval_success = True
                    
                # Citation validity check
                if any(d.get("source_url") and "incometax" in d.get("source_url") for d in agent_res["context_docs"]):
                    citation_success = True

            elif "capital_gains" in sc:
                cg_inp = sc["capital_gains"]
                cg_out = calculate_capital_gains(CapitalGainsInput(**cg_inp, financial_year=fy))
                if abs(cg_out["tax_amount"] - sc.get("expected_stcg_tax", cg_out["tax_amount"])) < 1.0:
                    calc_success = True
                retrieval_success = True
                citation_success = True

            if calc_success: passed_calc += 1
            if retrieval_success: passed_retrieval += 1
            if citation_success: valid_citations += 1
            
            scenario_results.append({
                "id": sc_id,
                "description": sc["description"],
                "financial_year": fy,
                "calc_passed": calc_success,
                "retrieval_passed": retrieval_success,
                "citation_valid": citation_success,
                "hallucination_detected": is_hallucination
            })
            
        calc_accuracy = (passed_calc / total_scenarios) * 100.0 if total_scenarios > 0 else 0.0
        retrieval_accuracy = (passed_retrieval / total_scenarios) * 100.0 if total_scenarios > 0 else 0.0
        citation_accuracy = (valid_citations / total_scenarios) * 100.0 if total_scenarios > 0 else 0.0
        hallucination_rate = (hallucinations / total_scenarios) * 100.0 if total_scenarios > 0 else 0.0
        
        overall_score = (calc_accuracy * 0.4) + (retrieval_accuracy * 0.3) + (citation_accuracy * 0.3) - hallucination_rate
        
        return {
            "total_scenarios_tested": total_scenarios,
            "calculation_accuracy_percent": round(calc_accuracy, 1),
            "retrieval_accuracy_percent": round(retrieval_accuracy, 1),
            "citation_accuracy_percent": round(citation_accuracy, 1),
            "hallucination_rate_percent": round(hallucination_rate, 1),
            "overall_system_score": round(overall_score, 1),
            "scenarios_detail": scenario_results
        }

if __name__ == "__main__":
    evaluator = TaxSystemEvaluator()
    print(json.dumps(evaluator.run_evaluations(), indent=2))
