from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Document Intelligence API",
    description="RAG Assistant Backend API for document intelligence and Q&A",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=Dict[str, str], tags=["Health"])
def health_check() -> Dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok"}
