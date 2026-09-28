from app.rag.retriever import get_retriever

def test_rag_retriever_section_80c():
    retriever = get_retriever()
    results = retriever.search("What is the limit for Section 80C deduction?", financial_year="2024-25")
    assert len(results) > 0
    assert "80C" in results[0]["section"]

def test_rag_retriever_section_115bac():
    retriever = get_retriever()
    rule = retriever.get_by_section("115BAC")
    assert rule is not None
    assert rule["id"] == "sec_115bac"

def test_rag_retriever_capital_gains():
    retriever = get_retriever()
    results = retriever.search("What is the LTCG tax rate for shares in FY 2024-25?", financial_year="2024-25")
    assert len(results) > 0
    assert any("112A" in r["section"] or "111A" in r["section"] for r in results)
