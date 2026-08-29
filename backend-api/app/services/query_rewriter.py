"""Query Rewriter for BNHS Conversational RAG.
Transforms context-dependent user follow-ups (e.g., 'When was it formed?', 'Who can participate?')
into complete, standalone semantic queries using conversation history.
"""

import os
from typing import Dict, List, Optional
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

REWRITER_SYSTEM_PROMPT = """You are an expert query contextualization assistant for the Bombay Natural History Society (BNHS) Knowledge Assistant.

Given a conversation history between a User and Assistant, and the latest user question which might reference context from earlier in the chat:
1. Rewrite the latest user question into a complete, clear, standalone question that can be understood WITHOUT looking at the conversation history.
2. Resolve all pronouns (such as "it", "they", "them", "this", "that", "these", "those", "the above", "which one", "the first one", "who can participate", etc.) using the entities, programs, camps, and topics mentioned in previous turns.
3. Preserve the user's original question intent exactly.
4. DO NOT answer the question.
5. DO NOT add new facts or invent entities not mentioned in the chat history.
6. Return ONLY the rewritten standalone question. Do NOT include explanations, preambles, or markdown quotes.

If the user's question is already completely standalone and does NOT depend on previous turns, return the question unchanged."""

PRONOUN_CUES = [
  "it", "it's", "its", "they", "them", "their", "this", "that", "these", "those",
  "the above", "which one", "which of", "who can", "when was", "where is", "how much",
  "what about", "and for", "the first", "the second", "there", "he", "she"
]


class QueryRewriter:
    """Transforms follow-up questions into standalone search queries using OpenRouter LLM."""

    _instance: Optional["QueryRewriter"] = None
    _llm: Optional[ChatOpenAI] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QueryRewriter, cls).__new__(cls)
            cls._instance._init_llm()
        return cls._instance

    def _init_llm(self):
        """Initializes the OpenRouter LLM for query rewriting."""
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        model = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")

        if not api_key:
            print("⚠️ QueryRewriter: OPENROUTER_API_KEY not found. Query rewriting will default to pass-through.")
            self._llm = None
            return

        try:
            self._llm = ChatOpenAI(
                model=model,
                openai_api_key=api_key,
                openai_api_base=base_url,
                temperature=0.0,
                max_tokens=150,
            )
        except Exception as e:
            print(f"⚠️ QueryRewriter LLM initialization failed: {e}")
            self._llm = None

    def _needs_rewriting(self, query: str, history: List[Dict[str, str]]) -> bool:
        """Heuristic check to determine if query has contextual references."""
        if not history:
            return False

        q_lower = query.lower()
        words = q_lower.split()

        # Check for short follow-up questions
        if len(words) <= 5:
            return True

        # Check for pronoun cues
        for cue in PRONOUN_CUES:
            if f" {cue} " in f" {q_lower} " or q_lower.startswith(f"{cue} "):
                return True

        return False

    def rewrite(self, query: str, history: List[Dict[str, str]]) -> str:
        """Rewrites query if context-dependent; otherwise returns original query."""
        clean_query = query.strip()
        if not history or not self._needs_rewriting(clean_query, history):
            return clean_query

        if not self._llm:
            self._init_llm()

        if not self._llm:
            return clean_query

        try:
            messages = [SystemMessage(content=REWRITER_SYSTEM_PROMPT)]

            # Format recent conversation history
            history_text_list = []
            for msg in history[-6:]:  # Use up to 3 turns
                role = "User" if msg.get("role") == "user" else "Assistant"
                content = msg.get("content", "").strip()
                # Truncate assistant answers to prevent context bloat
                if role == "Assistant" and len(content) > 300:
                    content = content[:300] + "..."
                history_text_list.append(f"{role}: {content}")

            history_context = "\n".join(history_text_list)
            user_prompt = f"Chat History:\n{history_context}\n\nLatest Question to Rewrite:\n{clean_query}\n\nStandalone Question:"

            messages.append(HumanMessage(content=user_prompt))
            response = self._llm.invoke(messages)
            rewritten = response.content.strip().strip('"').strip("'")

            if rewritten and len(rewritten) > 3:
                return rewritten
            return clean_query

        except Exception as e:
            print(f"⚠️ Query rewriter exception ({e}). Falling back to original query.")
            return clean_query


# Convenience singleton
query_rewriter = QueryRewriter()
