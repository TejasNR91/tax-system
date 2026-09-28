from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class IncomeDetails(BaseModel):
    salary: float = Field(default=0.0, ge=0, description="Gross annual salary income")
    house_property: float = Field(default=0.0, description="Income from house property (rental income minus municipal taxes/30% deduction) or negative for interest paid")
    capital_gains_stcg: float = Field(default=0.0, ge=0, description="Short-term capital gains")
    capital_gains_ltcg: float = Field(default=0.0, ge=0, description="Long-term capital gains")
    business_income: float = Field(default=0.0, ge=0, description="Profits and gains from business or profession")
    interest_income: float = Field(default=0.0, ge=0, description="Interest from savings, FDs, bonds")
    other_income: float = Field(default=0.0, ge=0, description="Other sources of income (dividends, gifts, etc.)")

class DeductionsDetails(BaseModel):
    sec_80c: float = Field(default=0.0, ge=0, description="PPF, EPF, ELSS, Life Insurance (capped at 1.5L in Old Regime)")
    sec_80d_self: float = Field(default=0.0, ge=0, description="Health insurance premium for self/family")
    sec_80d_parents: float = Field(default=0.0, ge=0, description="Health insurance premium for parents")
    sec_80ccd_1b: float = Field(default=0.0, ge=0, description="NPS self contribution (capped at 50k)")
    sec_80ccd_2: float = Field(default=0.0, ge=0, description="Employer NPS contribution")
    sec_24b: float = Field(default=0.0, ge=0, description="Home loan interest for self-occupied property (capped at 2L in Old Regime)")
    sec_80tta: float = Field(default=0.0, ge=0, description="Savings account interest deduction (max 10k)")
    sec_80ttb: float = Field(default=0.0, ge=0, description="Senior citizen interest deduction (max 50k)")
    hra_exemption: float = Field(default=0.0, ge=0, description="House Rent Allowance exemption")
    other_deductions: float = Field(default=0.0, ge=0, description="Section 80E, 80G, 80GG, etc.")

class TaxInput(BaseModel):
    financial_year: str = Field(default="2024-25", description="Financial year e.g. 2023-24, 2024-25, 2025-26")
    age: int = Field(default=30, ge=18, le=120, description="Age of taxpayer")
    is_salaried: bool = Field(default=True, description="Whether individual is salaried")
    incomes: IncomeDetails = Field(default_factory=IncomeDetails)
    deductions: DeductionsDetails = Field(default_factory=DeductionsDetails)
    tds_paid: float = Field(default=0.0, ge=0, description="TDS already deducted / Advance tax paid")

class CapitalGainsInput(BaseModel):
    financial_year: str = Field(default="2024-25")
    asset_type: str = Field(default="equity", description="equity, real_estate, debt, gold")
    sale_price: float = Field(ge=0)
    purchase_price: float = Field(ge=0)
    transfer_expenses: float = Field(default=0.0, ge=0)
    purchase_date: str = Field(description="YYYY-MM-DD")
    sale_date: str = Field(description="YYYY-MM-DD")
    exemption_claimed_sec54: float = Field(default=0.0, ge=0)

class SlabTaxItem(BaseModel):
    slab: str
    taxable_amount: float
    rate_percent: float
    tax_amount: float

class TaxCalculationResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    financial_year: str
    assessment_year: str
    regime: str
    gross_total_income: float
    total_deductions: float
    taxable_income: float
    base_tax: float
    slab_breakdown: List[SlabTaxItem]
    rebate_87a: float
    tax_after_rebate: float
    surcharge: float
    cess: float
    total_tax_liability: float
    tds_paid: float
    net_tax_payable_or_refund: float
    is_refund: bool
    audit_steps: List[str]

class RegimeComparisonResult(BaseModel):
    financial_year: str
    assessment_year: str
    gross_total_income: float
    old_regime: TaxCalculationResult
    new_regime: TaxCalculationResult
    recommended_regime: str
    tax_savings: float
    break_even_deductions_required: float
    summary: str
