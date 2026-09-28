from app.ai.agent import get_tax_agent

def test_tax_agent_salary_query():
    agent = get_tax_agent()
    res = agent.process_query("I earn ₹15 lakh salary. Which tax regime should I evaluate for FY 2024-25?")
    assert "2024-25" in res["financial_year"]
    assert len(res["tool_results"]) > 0
    assert "NEW REGIME" in res["response"] or "OLD REGIME" in res["response"]
    assert len(res["context_docs"]) > 0

def test_tax_agent_capital_gains_query():
    agent = get_tax_agent()
    res = agent.process_query("I sold shares for 8 lakh that I bought for 3 lakh in FY 2024-25.")
    assert len(res["tool_results"]) > 0
    cg = res["tool_results"][0]["output"]
    assert cg["gross_gain"] == 500000.0
    assert cg["taxable_gain"] == 375000.0 # 5L - 1.25L exemption
