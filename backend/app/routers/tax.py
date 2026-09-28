from fastapi import APIRouter, HTTPException
from app.tax_engine.models import TaxInput, CapitalGainsInput, TaxCalculationResult, RegimeComparisonResult
from app.tax_engine.calculator import calculate_tax_for_regime, compare_regimes, calculate_capital_gains
from app.ai.tools import tool_tax_scenario_simulator
from app.db.database import log_calculation

router = APIRouter(prefix="/api/tax", tags=["Tax Calculations"])

@router.post("/calculate", response_model=TaxCalculationResult)
def calculate_tax(inputs: TaxInput, regime: str = "new"):
    try:
        res = calculate_tax_for_regime(inputs, regime)
        log_calculation(
            financial_year=res.financial_year,
            regime=res.regime,
            gross_income=res.gross_total_income,
            taxable_income=res.taxable_income,
            total_tax=res.total_tax_liability,
            breakdown=res.model_dump()
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare", response_model=RegimeComparisonResult)
def compare_tax_regimes(inputs: TaxInput):
    try:
        res = compare_regimes(inputs)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/capital-gains")
def calculate_cg(inputs: CapitalGainsInput):
    try:
        res = calculate_capital_gains(inputs)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate")
def simulate_tax_scenario(payload: dict):
    try:
        salary = float(payload.get("salary", 0.0))
        sec_80c = float(payload.get("sec_80c", 0.0))
        sec_nps = float(payload.get("sec_nps", 0.0))
        sec_80d = float(payload.get("sec_80d", 0.0))
        fy = str(payload.get("financial_year", "2024-25"))
        
        return tool_tax_scenario_simulator(salary, sec_80c, sec_nps, sec_80d, fy)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
