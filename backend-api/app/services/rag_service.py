"""RAG Service Wrapper for BNHS Knowledge Base with Conversational Memory.
Integrates with the existing bnhs-rag pipeline, session storage, and query contextualization.
"""

import os
import sys
import types
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

# Locate project directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent
RAG_DIR = WORKSPACE_ROOT / "bnhs-rag"
REC_DIR = WORKSPACE_ROOT / "recomendation-system"

rag_src = str(RAG_DIR / "src")
rec_src = str(REC_DIR / "src")

# Configure unified src namespace
if "src" not in sys.modules:
    src_mod = types.ModuleType("src")
    src_mod.__path__ = [rag_src, rec_src]
    sys.modules["src"] = src_mod
else:
    src_paths = getattr(sys.modules["src"], "__path__", [])
    if rag_src not in src_paths:
        src_paths.append(rag_src)
    if rec_src not in src_paths:
        src_paths.append(rec_src)
    sys.modules["src"].__path__ = src_paths

# Load environment from backend-api/.env first, then bnhs-rag/.env
backend_env = BACKEND_DIR / ".env"
rag_env = RAG_DIR / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
elif rag_env.exists():
    load_dotenv(dotenv_path=rag_env, override=True)

from app.services.conversation_memory import conversation_memory
from app.services.query_rewriter import query_rewriter


class RAGService:
    """Service wrapper for executing conversational RAG queries against the BNHS Knowledge Base."""

    _instance: Optional["RAGService"] = None
    _pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
            cls._instance._initialize_pipeline()
        return cls._instance

    def _initialize_pipeline(self):
        """Initializes the existing BNHSRAGPipeline."""
        try:
            rag_path_str = str(RAG_DIR)
            if rag_path_str not in sys.path:
                sys.path.insert(0, rag_path_str)

            from src.rag_pipeline import BNHSRAGPipeline
            self._pipeline = BNHSRAGPipeline(
                pdf_path=RAG_DIR / "data" / "BNHS_Master_Clean_RAG_Knowledge_Base_25_Pages.pdf",
                persist_directory=RAG_DIR / "vectorstore" / "chroma_db",
            )
            print(" RAGService successfully initialized connected to bnhs-rag.")
        except Exception as e:
            print(f"⚠️ Failed to initialize RAG pipeline: {e}")
            self._pipeline = None

    def query(
        self,
        question: str,
        session_id: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Executes a conversational or standalone query and returns structured answer and sources."""
        if not self._pipeline:
            self._initialize_pipeline()

        if not self._pipeline:
            raise RuntimeError("RAG Pipeline is currently unavailable.")

        clean_q = question.strip()
        if not clean_q:
            raise ValueError("Query string cannot be empty.")

        rewritten_query = clean_q

        # If session_id is supplied, check conversation history and rewrite query if necessary
        if session_id:
            history = conversation_memory.get_history(session_id)
            if history:
                rewritten_query = query_rewriter.rewrite(clean_q, history)

        # Execute existing RAG pipeline with the standalone search query
        response = self._pipeline.query(rewritten_query, top_k=top_k)

        # Record turn in conversation memory if session_id is active
        if session_id:
            conversation_memory.add_message_turn(
                session_id=session_id,
                user_query=clean_q,
                assistant_answer=response.answer,
                rewritten_query=rewritten_query if rewritten_query != clean_q else None,
            )

        return {
            "session_id": session_id,
            "query": clean_q,
            "rewritten_query": rewritten_query if rewritten_query != clean_q else None,
            "answer": response.answer,
            "sources": response.sources,
            "grounded": response.grounded,
        }

    def is_healthy(self) -> bool:
        """Checks if RAG pipeline is initialized and operational."""
        return self._pipeline is not None
