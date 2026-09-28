from app.tax_engine.models import TaxInput, IncomeDetails, DeductionsDetails, CapitalGainsInput
from app.tax_engine.calculator import calculate_tax_for_regime, compare_regimes, calculate_capital_gains

def test_fy24_25_new_regime_7lakh_zero_tax():
    inputs = TaxInput(
        financial_year="2024-25",
        is_salaried=True,
        incomes=IncomeDetails(salary=775000) # 7.75L salary - 75k std ded = 7.0L taxable
    )
    result = calculate_tax_for_regime(inputs, "new")
    assert result.gross_total_income == 775000
    assert result.total_deductions == 75000
    assert result.taxable_income == 700000
    assert result.rebate_87a == 20000.0
    assert result.total_tax_liability == 0.0

def test_fy24_25_old_vs_new_comparison():
    inputs = TaxInput(
        financial_year="2024-25",
        is_salaried=True,
        incomes=IncomeDetails(salary=1500000),
        deductions=DeductionsDetails(
            sec_80c=150000,
            sec_80d_self=25000,
            sec_80ccd_1b=50000,
            sec_24b=200000
        )
    )
    comp = compare_regimes(inputs)
    assert comp.old_regime.taxable_income == 1025000 # 15L - 50k - 1.5L - 25k - 50k - 2L
    assert comp.new_regime.taxable_income == 1425000 # 15L - 75k
    assert comp.recommended_regime in ["old", "new"]

def test_capital_gains_equity_fy24_25():
    cg_input = CapitalGainsInput(
        financial_year="2024-25",
        asset_type="equity",
        sale_price=800000,
        purchase_price=300000,
        purchase_date="2022-01-01",
        sale_date="2024-08-01"
    )
    res = calculate_capital_gains(cg_input)
    assert res["is_ltcg"] is True
    assert res["gross_gain"] == 500000
    # 5L gain - 1.25L exemption = 3.75L taxable @ 12.5%
    assert res["taxable_gain"] == 375000
    assert res["tax_amount"] == 46875.0
