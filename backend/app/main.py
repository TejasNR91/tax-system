from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tax, chat, rag, auth, news
from app.db.database import init_db

app = FastAPI(
    title="AI-Powered Indian Tax Assistant API",
    description="Deterministic Tax Engine, Vector RAG Knowledge Base, Tool-calling Agent, and Evaluation Framework",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

app.include_router(auth.router)
app.include_router(news.router)
app.include_router(tax.router)
app.include_router(chat.router)
app.include_router(rag.router_rag)
app.include_router(rag.router_eval)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Indian Tax Reasoning System API",
        "supported_financial_years": ["2023-24", "2024-25", "2025-26"],
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
