from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.ai.agent import get_tax_agent
from app.db.database import log_chat_query, get_recent_chat_logs

router = APIRouter(prefix="/api/chat", tags=["AI Tax Assistant"])

class ChatMessagePayload(BaseModel):
    message: str
    financial_year: str = "2024-25"
    chat_history: Optional[List[Dict[str, str]]] = None

@router.post("")
def chat_with_agent(payload: ChatMessagePayload):
    try:
        agent = get_tax_agent()
        result = agent.process_query(
            user_query=payload.message,
            financial_year=payload.financial_year,
            chat_history=payload.chat_history
        )
        
        log_chat_query(
            query=payload.message,
            financial_year=result["financial_year"],
            response=result["response"],
            tool_results=result["tool_results"],
            audit_trail=result["audit_trail"]
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_chat_history(limit: int = 10):
    return get_recent_chat_logs(limit=limit)
