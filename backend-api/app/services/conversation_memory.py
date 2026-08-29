"""Conversation Memory Manager for BNHS Conversational RAG.
Stores and manages session-based chat histories in MongoDB (conversations collection)
with automatic in-memory fallback.
"""

from datetime import datetime, timezone
import os
from typing import Any, Dict, List, Optional
from app.database.mongodb import get_db, is_mongodb_available

MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))


class ConversationMemory:
    """Manages chat session histories with MongoDB persistence and in-memory fallback."""

    _instance: Optional["ConversationMemory"] = None
    _in_memory_store: Dict[str, List[Dict[str, str]]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConversationMemory, cls).__new__(cls)
            cls._instance._in_memory_store = {}
        return cls._instance

    def get_history(self, session_id: str, limit: int = MAX_HISTORY_MESSAGES) -> List[Dict[str, str]]:
        """Retrieves recent conversation messages for a session_id."""
        if not session_id:
            return []

        db = get_db()
        if db is not None and is_mongodb_available():
            try:
                coll = db["conversations"]
                doc = coll.find_one({"session_id": session_id})
                if doc and "messages" in doc:
                    messages = doc["messages"]
                    return messages[-limit:]
            except Exception as e:
                print(f"⚠️ Failed to load history from MongoDB ({e}). Falling back to memory.")

        # In-memory fallback
        messages = self._in_memory_store.get(session_id, [])
        return messages[-limit:]

    def add_message_turn(
        self,
        session_id: str,
        user_query: str,
        assistant_answer: str,
        rewritten_query: Optional[str] = None,
    ):
        """Appends a user/assistant turn to the session history."""
        if not session_id or not user_query.strip():
            return

        now = datetime.now(timezone.utc).isoformat()
        user_msg = {
            "role": "user",
            "content": user_query.strip(),
            "timestamp": now,
        }
        if rewritten_query and rewritten_query != user_query:
            user_msg["rewritten_query"] = rewritten_query

        assistant_msg = {
            "role": "assistant",
            "content": assistant_answer.strip(),
            "timestamp": now,
        }

        # Update in-memory
        if session_id not in self._in_memory_store:
            self._in_memory_store[session_id] = []
        self._in_memory_store[session_id].extend([user_msg, assistant_msg])

        # Update MongoDB
        db = get_db()
        if db is not None and is_mongodb_available():
            try:
                coll = db["conversations"]
                coll.update_one(
                    {"session_id": session_id},
                    {
                        "$push": {
                            "messages": {
                                "$each": [user_msg, assistant_msg],
                                "$slice": -50,  # Keep last 50 turns in DB
                            }
                        },
                        "$set": {"updated_at": now},
                        "$setOnInsert": {"created_at": now},
                    },
                    upsert=True,
                )
            except Exception as e:
                print(f"⚠️ Failed to persist conversation turn to MongoDB ({e}).")

    def clear_session(self, session_id: str) -> bool:
        """Deletes conversation history for a given session_id."""
        if not session_id:
            return False

        # Clear in-memory
        self._in_memory_store.pop(session_id, None)

        # Clear MongoDB
        db = get_db()
        if db is not None and is_mongodb_available():
            try:
                coll = db["conversations"]
                coll.delete_one({"session_id": session_id})
                return True
            except Exception as e:
                print(f"⚠️ Failed to clear session from MongoDB ({e}).")
                return False

        return True


# Convenience singleton
conversation_memory = ConversationMemory()
