"""Chat Router for Conversational RAG & Knowledge Base Queries.
Exposes POST /api/v1/chat/query with multi-turn session memory, history retrieval, and session deletion.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    ChatClearResponse,
    ChatHistoryMessage,
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    Source,
)
from app.services.conversation_memory import conversation_memory
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/v1/chat", tags=["AI Assistant & RAG"])
rag_service = RAGService()


@router.post(
    "/query",
    response_model=ChatResponse,
    summary="Query BNHS RAG Knowledge Base (with Conversational Memory)",
    description="Accepts natural language questions, contextualizes follow-up pronouns (it, they, them, etc.) using session memory, retrieves grounded context, and generates verified citations.",
)
async def query_knowledge_base(request: ChatRequest) -> ChatResponse:
    """Executes conversational or standalone query against the BNHS RAG pipeline."""
    try:
        result = rag_service.query(
            question=request.query,
            session_id=request.session_id,
        )

        sources = [
            Source(
                document=s.get("document", "BNHS_Knowledge_Base"),
                page=s.get("page", "N/A"),
                section=s.get("section", "General"),
            )
            for s in result.get("sources", [])
        ]

        return ChatResponse(
            session_id=result.get("session_id"),
            query=result.get("query"),
            rewritten_query=result.get("rewritten_query"),
            answer=result.get("answer", "I could not find sufficient information about this in the BNHS knowledge base."),
            sources=sources,
        )

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the RAG query: {str(e)}",
        )


@router.get(
    "/{session_id}/history",
    response_model=ChatHistoryResponse,
    summary="Get Chat Session History",
    description="Retrieves the multi-turn conversation message history for a given session ID.",
)
async def get_session_history(session_id: str) -> ChatHistoryResponse:
    """Returns conversation messages for a session."""
    try:
        raw_messages = conversation_memory.get_history(session_id, limit=50)
        messages = [
            ChatHistoryMessage(
                role=m.get("role", "user"),
                content=m.get("content", ""),
                rewritten_query=m.get("rewritten_query"),
                timestamp=m.get("timestamp"),
            )
            for m in raw_messages
        ]
        return ChatHistoryResponse(
            session_id=session_id,
            messages=messages,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving session history: {str(e)}",
        )


@router.delete(
    "/{session_id}",
    response_model=ChatClearResponse,
    summary="Clear Chat Session History",
    description="Deletes all conversation history for a given session ID from MongoDB and memory.",
)
async def clear_session_history(session_id: str) -> ChatClearResponse:
    """Clears conversation history for the specified session."""
    try:
        success = conversation_memory.clear_session(session_id)
        return ChatClearResponse(
            session_id=session_id,
            message=f"Conversation history for session '{session_id}' cleared successfully.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing session: {str(e)}",
        )
