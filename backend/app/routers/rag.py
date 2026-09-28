from fastapi import APIRouter
from app.rag.retriever import get_retriever
from app.evaluation.evaluator import TaxSystemEvaluator
from app.db.database import get_recent_history

router_rag = APIRouter(prefix="/api/rag", tags=["RAG Knowledge Base"])
router_eval = APIRouter(prefix="/api/eval", tags=["Evaluation & Backtesting"])

@router_rag.get("/search")
def search_rag(query: str, financial_year: str = "2024-25", category: str = None):
    retriever = get_retriever()
    return retriever.search(query, financial_year=financial_year, category=category, top_k=5)

@router_rag.get("/rules")
def list_all_rules():
    retriever = get_retriever()
    return retriever.rules

@router_rag.get("/rule/{section}")
def get_rule_detail(section: str):
    retriever = get_retriever()
    rule = retriever.get_by_section(section)
    return rule if rule else {"error": "Section not found"}

@router_eval.get("/run")
def run_evaluation_suite():
    evaluator = TaxSystemEvaluator()
    return evaluator.run_evaluations()

@router_eval.get("/history")
def get_calc_history(limit: int = 10):
    return get_recent_history(limit=limit)
