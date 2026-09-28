from typing import Dict, Any, List
from app.tax_engine.models import TaxInput, IncomeDetails, DeductionsDetails, CapitalGainsInput
from app.tax_engine.calculator import calculate_tax_for_regime, compare_regimes, calculate_capital_gains, calculate_salary_income
from app.rag.retriever import get_retriever

def tool_tax_calculator(financial_year: str = "2024-25", salary: float = 0.0, age: int = 30, sec_80c: float = 0.0, sec_80d: float = 0.0, regime: str = "new") -> Dict[str, Any]:
    inputs = TaxInput(
        financial_year=financial_year,
        age=age,
        incomes=IncomeDetails(salary=salary),
        deductions=DeductionsDetails(sec_80c=sec_80c, sec_80d_self=sec_80d)
    )
    res = calculate_tax_for_regime(inputs, regime.lower())
    return res.model_dump()

def tool_regime_comparison(financial_year: str = "2024-25", salary: float = 0.0, age: int = 30, sec_80c: float = 0.0, sec_80d: float = 0.0, sec_24b: float = 0.0, sec_80ccd_1b: float = 0.0) -> Dict[str, Any]:
    inputs = TaxInput(
        financial_year=financial_year,
        age=age,
        incomes=IncomeDetails(salary=salary),
        deductions=DeductionsDetails(
            sec_80c=sec_80c,
            sec_80d_self=sec_80d,
            sec_24b=sec_24b,
            sec_80ccd_1b=sec_80ccd_1b
        )
    )
    res = compare_regimes(inputs)
    return res.model_dump()

def tool_capital_gains_calculator(financial_year: str = "2024-25", asset_type: str = "equity", sale_price: float = 0.0, purchase_price: float = 0.0, purchase_date: str = "2023-01-01", sale_date: str = "2024-08-01") -> Dict[str, Any]:
    cg_input = CapitalGainsInput(
        financial_year=financial_year,
        asset_type=asset_type,
        sale_price=sale_price,
        purchase_price=purchase_price,
        purchase_date=purchase_date,
        sale_date=sale_date
    )
    return calculate_capital_gains(cg_input)

def tool_salary_tax_calculator(gross_salary: float, hra_exemption: float = 0.0, financial_year: str = "2024-25") -> Dict[str, Any]:
    std_ded = 75000.0 if financial_year in ["2024-25", "2025-26"] else 50000.0
    net_salary_new = calculate_salary_income(gross_salary, std_ded, 0.0)
    net_salary_old = calculate_salary_income(gross_salary, 50000.0, hra_exemption)
    return {
        "gross_salary": gross_salary,
        "standard_deduction_new": std_ded,
        "standard_deduction_old": 50000.0,
        "hra_exemption": hra_exemption,
        "net_taxable_salary_old": net_salary_old,
        "net_taxable_salary_new": net_salary_new
    }

def tool_tax_rule_search(query: str, financial_year: str = "2024-25") -> List[Dict[str, Any]]:
    retriever = get_retriever()
    return retriever.search(query, financial_year=financial_year, top_k=3)

def tool_document_search(section: str) -> Dict[str, Any]:
    retriever = get_retriever()
    rule = retriever.get_by_section(section)
    return rule if rule else {"error": f"Section {section} not found in knowledge base."}

def tool_tds_calculator(total_income: float, tds_deductions_made: float, financial_year: str = "2024-25") -> Dict[str, Any]:
    inputs = TaxInput(financial_year=financial_year, incomes=IncomeDetails(salary=total_income), tds_paid=tds_deductions_made)
    res = calculate_tax_for_regime(inputs, "new")
    net = res.net_tax_payable_or_refund
    return {
        "financial_year": financial_year,
        "taxable_income": res.taxable_income,
        "total_tax_liability": res.total_tax_liability,
        "tds_deducted": tds_deductions_made,
        "balance_tax_payable": max(0.0, net),
        "refund_due": abs(net) if net < 0 else 0.0,
        "status": "REFUND" if net < 0 else ("SETTLED" if net == 0 else "PAYABLE")
    }

def tool_tax_scenario_simulator(current_salary: float, proposed_80c: float, proposed_nps: float, proposed_health_insurance: float, financial_year: str = "2024-25") -> Dict[str, Any]:
    base_inputs = TaxInput(financial_year=financial_year, incomes=IncomeDetails(salary=current_salary))
    sim_inputs = TaxInput(
        financial_year=financial_year,
        incomes=IncomeDetails(salary=current_salary),
        deductions=DeductionsDetails(sec_80c=proposed_80c, sec_80ccd_1b=proposed_nps, sec_80d_self=proposed_health_insurance)
    )
    base_res = compare_regimes(base_inputs)
    sim_res = compare_regimes(sim_inputs)
    
    total_invested = proposed_80c + proposed_nps + proposed_health_insurance
    old_savings = base_res.old_regime.total_tax_liability - sim_res.old_regime.total_tax_liability
    
    return {
        "financial_year": financial_year,
        "total_new_investments": total_invested,
        "old_regime_tax_before": base_res.old_regime.total_tax_liability,
        "old_regime_tax_after": sim_res.old_regime.total_tax_liability,
        "tax_saved_under_old_regime": old_savings,
        "roi_tax_savings_percent": (old_savings / total_invested * 100) if total_invested > 0 else 0.0,
        "recommended_action": f"Investing ₹{total_invested:,.0f} saves ₹{old_savings:,.0f} in tax under Old Regime."
    }
