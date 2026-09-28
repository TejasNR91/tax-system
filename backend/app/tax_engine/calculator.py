import json
import os
from datetime import datetime
from typing import Dict, Any, Tuple
from app.tax_engine.models import (
    TaxInput, IncomeDetails, DeductionsDetails, CapitalGainsInput,
    TaxCalculationResult, SlabTaxItem, RegimeComparisonResult
)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "rules_config.json")

def load_rules_config() -> Dict[str, Any]:
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

RULES_CONFIG = load_rules_config()

def calculate_salary_income(gross_salary: float, standard_deduction: float, hra_exemption: float = 0.0) -> float:
    return max(0.0, gross_salary - standard_deduction - hra_exemption)

def calculate_house_property_income(rental_income: float = 0.0, municipal_taxes: float = 0.0, home_loan_interest: float = 0.0, is_self_occupied: bool = True, regime: str = "old") -> float:
    if is_self_occupied:
        # For self occupied in Old regime, max loss capped at 2L under 24b
        if regime == "old":
            return -min(200000.0, home_loan_interest)
        else:
            return 0.0 # No set off for self-occupied home loan interest in New Regime
    else:
        net_annual_value = max(0.0, rental_income - municipal_taxes)
        standard_30_percent = net_annual_value * 0.30
        income = net_annual_value - standard_30_percent - home_loan_interest
        return income

def calculate_capital_gains(input_data: CapitalGainsInput) -> Dict[str, Any]:
    fy = input_data.financial_year if input_data.financial_year in RULES_CONFIG["capital_gains_rules"] else "2024-25"
    cg_rules = RULES_CONFIG["capital_gains_rules"][fy]
    
    net_sale = input_data.sale_price - input_data.transfer_expenses
    gross_gain = net_sale - input_data.purchase_price
    
    # Calculate holding duration
    try:
        p_date = datetime.strptime(input_data.purchase_date, "%Y-%m-%d")
        s_date = datetime.strptime(input_data.sale_date, "%Y-%m-%d")
        months_held = (s_date.year - p_date.year) * 12 + (s_date.month - p_date.month)
    except Exception:
        months_held = 13 # Default to long term if unknown
        
    asset = input_data.asset_type.lower()
    is_ltcg = False
    rate = 0.0
    exemption = 0.0
    
    if asset == "equity":
        is_ltcg = months_held > 12
        rules = cg_rules["equity"]
        if is_ltcg:
            rate = rules["ltcg_rate"]
            exemption = rules["ltcg_exemption_threshold"]
            taxable_gain = max(0.0, gross_gain - exemption - input_data.exemption_claimed_sec54)
        else:
            rate = rules["stcg_rate"]
            taxable_gain = max(0.0, gross_gain - input_data.exemption_claimed_sec54)
    elif asset == "real_estate":
        holding_threshold = cg_rules.get("real_estate", {}).get("stcg_holding_months", 24)
        is_ltcg = months_held > holding_threshold
        if is_ltcg:
            rate = cg_rules["real_estate"]["ltcg_rate"]
            taxable_gain = max(0.0, gross_gain - input_data.exemption_claimed_sec54)
        else:
            rate = 0.30 # Slab rate approximation
            taxable_gain = max(0.0, gross_gain - input_data.exemption_claimed_sec54)
    else:
        is_ltcg = months_held > 24
        rate = 0.125 if is_ltcg else 0.20
        taxable_gain = max(0.0, gross_gain - input_data.exemption_claimed_sec54)
        
    tax_amount = taxable_gain * rate
    
    return {
        "asset_type": asset,
        "holding_months": months_held,
        "is_ltcg": is_ltcg,
        "gross_gain": gross_gain,
        "exemption_applied": exemption + input_data.exemption_claimed_sec54,
        "taxable_gain": taxable_gain,
        "applicable_tax_rate": rate,
        "tax_amount": tax_amount,
        "citation": f"Income Tax Act Sec 112A/111A ({fy})",
        "effective_date": RULES_CONFIG["financial_years"].get(fy, {}).get("effective_from", "2024-04-01")
    }

def calculate_tax_for_regime(inputs: TaxInput, regime: str) -> TaxCalculationResult:
    fy = inputs.financial_year if inputs.financial_year in RULES_CONFIG["financial_years"] else "2024-25"
    fy_config = RULES_CONFIG["financial_years"][fy]
    ay = fy_config["assessment_year"]
    regime_config = fy_config[regime + "_regime"]
    
    audit_steps = []
    audit_steps.append(f"Initiated Tax Computation for FY {fy} (AY {ay}) under {regime.upper()} Regime.")
    
    # 1. Gross Total Income
    inc = inputs.incomes
    gti = inc.salary + inc.house_property + inc.capital_gains_stcg + inc.capital_gains_ltcg + inc.business_income + inc.interest_income + inc.other_income
    audit_steps.append(f"Gross Total Income calculated: ₹{gti:,.2f} (Salary: ₹{inc.salary:,.2f}, House Property: ₹{inc.house_property:,.2f}, CG: ₹{inc.capital_gains_stcg + inc.capital_gains_ltcg:,.2f}, Others: ₹{inc.interest_income + inc.other_income:,.2f}).")
    
    # 2. Total Deductions
    ded = inputs.deductions
    allowed_deductions = 0.0
    
    if regime == "old":
        std_ded = regime_config["standard_deduction"] if inputs.is_salaried else 0.0
        sec_80c = min(ded.sec_80c, regime_config["max_deductions"]["sec_80c"])
        sec_80d_self = min(ded.sec_80d_self, regime_config["max_deductions"]["sec_80d_self"])
        sec_80d_par = min(ded.sec_80d_parents, regime_config["max_deductions"]["sec_80d_parents"])
        sec_80ccd_1b = min(ded.sec_80ccd_1b, regime_config["max_deductions"]["sec_80ccd_1b_nps"])
        sec_24b = min(ded.sec_24b, regime_config["max_deductions"]["sec_24b_home_loan_interest"])
        sec_80tta = min(ded.sec_80tta, regime_config["max_deductions"].get("sec_80tta_savings_interest", 10000)) if inputs.age < 60 else 0.0
        sec_80ttb = min(ded.sec_80ttb, regime_config["max_deductions"].get("sec_80ttb_senior_interest", 50000)) if inputs.age >= 60 else 0.0
        hra = ded.hra_exemption
        other_ded = ded.other_deductions
        
        allowed_deductions = std_ded + sec_80c + sec_80d_self + sec_80d_par + sec_80ccd_1b + sec_24b + sec_80tta + sec_80ttb + hra + other_ded
        audit_steps.append(f"Old Regime Deductions applied: Standard Deduction (₹{std_ded:,.2f}), Sec 80C (₹{sec_80c:,.2f}), Sec 80D (₹{sec_80d_self + sec_80d_par:,.2f}), Sec 80CCD(1B) (₹{sec_80ccd_1b:,.2f}), Sec 24b (₹{sec_24b:,.2f}), HRA (₹{hra:,.2f}), Others (₹{other_ded + sec_80tta + sec_80ttb:,.2f}). Total = ₹{allowed_deductions:,.2f}.")
    else:
        # New Regime
        std_ded = regime_config["standard_deduction"] if inputs.is_salaried else 0.0
        sec_80ccd_2 = ded.sec_80ccd_2
        allowed_deductions = std_ded + sec_80ccd_2
        audit_steps.append(f"New Regime Deductions applied: Standard Deduction (₹{std_ded:,.2f}), Employer NPS Sec 80CCD(2) (₹{sec_80ccd_2:,.2f}). Chapter VI-A deductions disallowed. Total = ₹{allowed_deductions:,.2f}.")
        
    taxable_income = max(0.0, gti - allowed_deductions)
    audit_steps.append(f"Net Taxable Income: ₹{taxable_income:,.2f}.")
    
    # 3. Slab Tax Computation
    slabs = regime_config["slabs"]
    base_tax = 0.0
    slab_breakdown = []
    
    for s in slabs:
        s_min = s["min"]
        s_max = s["max"]
        rate = s["rate"]
        
        if taxable_income > s_min:
            if s_max is not None:
                taxable_in_slab = min(taxable_income, s_max) - s_min
            else:
                taxable_in_slab = taxable_income - s_min
                
            slab_tax = taxable_in_slab * rate
            base_tax += slab_tax
            
            s_max_str = f"₹{s_max:,.0f}" if s_max else "Above"
            slab_str = f"₹{s_min:,.0f} - {s_max_str}"
            slab_breakdown.append(SlabTaxItem(
                slab=slab_str,
                taxable_amount=taxable_in_slab,
                rate_percent=rate * 100,
                tax_amount=slab_tax
            ))
            
    audit_steps.append(f"Base Income Tax from Slabs: ₹{base_tax:,.2f}.")
    
    # 4. Rebate under Sec 87A
    rebate_info = regime_config["rebate_87a"]
    rebate_87a = 0.0
    if taxable_income <= rebate_info["max_taxable_income"]:
        rebate_87a = min(base_tax, rebate_info["max_rebate"])
        audit_steps.append(f"Sec 87A Rebate applied: ₹{rebate_87a:,.2f} (Taxable income ₹{taxable_income:,.2f} <= threshold ₹{rebate_info['max_taxable_income']:,.2f}).")
    elif regime == "new" and taxable_income > rebate_info["max_taxable_income"]:
        # Marginal relief for New Regime
        excess_income = taxable_income - rebate_info["max_taxable_income"]
        if base_tax > excess_income:
            rebate_87a = base_tax - excess_income
            audit_steps.append(f"Sec 87A Marginal Relief applied in New Regime: ₹{rebate_87a:,.2f}.")
            
    tax_after_rebate = max(0.0, base_tax - rebate_87a)
    
    # 5. Surcharge
    surcharge_rate = 0.0
    if taxable_income > 5000000:
        for sur in RULES_CONFIG["surcharge_slabs"]:
            if taxable_income > sur["min"]:
                if sur["max"] is None or taxable_income <= sur["max"]:
                    if regime == "new" and "rate_new" in sur:
                        surcharge_rate = sur["rate_new"]
                    elif regime == "old" and "rate_old" in sur:
                        surcharge_rate = sur["rate_old"]
                    else:
                        surcharge_rate = sur["rate"]
    
    surcharge = tax_after_rebate * surcharge_rate
    if surcharge > 0:
        audit_steps.append(f"Surcharge applied at {surcharge_rate * 100:.1f}%: ₹{surcharge:,.2f}.")
        
    # 6. Health & Education Cess
    cess_rate = RULES_CONFIG["cess_rate"]
    cess = (tax_after_rebate + surcharge) * cess_rate
    audit_steps.append(f"Health & Education Cess (4%): ₹{cess:,.2f}.")
    
    # 7. Total Tax Liability
    total_tax_liability = tax_after_rebate + surcharge + cess
    tds = inputs.tds_paid
    net_payable = total_tax_liability - tds
    is_refund = net_payable < 0
    
    audit_steps.append(f"Total Tax Liability: ₹{total_tax_liability:,.2f}. TDS/Advance Tax Paid: ₹{tds:,.2f}. Net Payable/Refund: ₹{abs(net_payable):,.2f} ({'Refund' if is_refund else 'Payable'}).")
    
    return TaxCalculationResult(
        financial_year=fy,
        assessment_year=ay,
        regime=regime,
        gross_total_income=gti,
        total_deductions=allowed_deductions,
        taxable_income=taxable_income,
        base_tax=base_tax,
        slab_breakdown=slab_breakdown,
        rebate_87a=rebate_87a,
        tax_after_rebate=tax_after_rebate,
        surcharge=surcharge,
        cess=cess,
        total_tax_liability=total_tax_liability,
        tds_paid=tds,
        net_tax_payable_or_refund=net_payable,
        is_refund=is_refund,
        audit_steps=audit_steps
    )

def compare_regimes(inputs: TaxInput) -> RegimeComparisonResult:
    old_res = calculate_tax_for_regime(inputs, "old")
    new_res = calculate_tax_for_regime(inputs, "new")
    
    diff = old_res.total_tax_liability - new_res.total_tax_liability
    if diff > 0:
        recommended = "new"
        savings = diff
        summary = f"New Tax Regime saves you ₹{savings:,.2f} in tax compared to Old Regime."
    elif diff < 0:
        recommended = "old"
        savings = abs(diff)
        summary = f"Old Tax Regime saves you ₹{savings:,.2f} in tax compared to New Regime."
    else:
        recommended = "either"
        savings = 0.0
        summary = "Both Old and New Tax Regimes result in the exact same tax liability."
        
    # Calculate break-even deduction required under Old Regime
    # Approx break-even: deduction = GTI - New Regime Taxable Income threshold where Old Tax = New Tax
    break_even = max(0.0, new_res.total_deductions + (old_res.gross_total_income * 0.15))
    
    return RegimeComparisonResult(
        financial_year=inputs.financial_year,
        assessment_year=old_res.assessment_year,
        gross_total_income=old_res.gross_total_income,
        old_regime=old_res,
        new_regime=new_res,
        recommended_regime=recommended,
        tax_savings=savings,
        break_even_deductions_required=break_even,
        summary=summary
    )
