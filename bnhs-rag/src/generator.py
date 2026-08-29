"""BNHS RAG Response Generator Module.
Constructs grounded prompts, orchestrates LLM invocation across providers
(OpenRouter, OpenAI, Google Gemini, Anthropic, Ollama, Local Extractive), and formats citations.
"""

import os
import re
from typing import Any, Dict, List, Optional
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage

from src.config import Config

# Standard insufficient information fallback string
INSUFFICIENT_INFO_MESSAGE = "I could not find sufficient information about this in the BNHS knowledge base."

SYSTEM_PROMPT = """You are the official AI assistant for the Bombay Natural History Society (BNHS).
Your task is to provide accurate, grounded answers based EXCLUSIVELY on the provided BNHS Knowledge Base context.

STRICT GROUNDING INSTRUCTIONS:
1. Base your answer ONLY on the retrieved context provided below.
2. Do NOT make up facts, guess, or use external knowledge not present in the context.
3. If the retrieved context does NOT contain sufficient information to answer the question, you MUST reply with EXACTLY:
   "I could not find sufficient information about this in the BNHS knowledge base."
4. Keep answers factual, concise, clear, and well-structured (bullet points where appropriate).
5. In your answer, reference the specific facts, programs, or dates mentioned in the documents.
"""

USER_PROMPT_TEMPLATE = """Context from BNHS Knowledge Base:
----------------------------------------
{context}
----------------------------------------

User Question: {question}

Provide a grounded, accurate answer based strictly on the context above:"""


class BNHSGenerator:
    """LLM Generator that guarantees strict grounding against retrieved context."""

    def __init__(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = Config.LLM_TEMPERATURE,
    ):
        """Initializes the LLM generator with the selected provider and model.
        
        Args:
            provider: 'openrouter', 'openai', 'gemini', 'anthropic', 'ollama', 'auto', or 'local_fallback'.
            model_name: Name of the LLM model to use.
            temperature: Sampling temperature (default 0.0 for strict factual accuracy).
        """
        self.temperature = temperature
        self.provider = (provider or Config.get_active_llm_provider()).lower()
        self.model_name = model_name or Config.LLM_MODEL
        self.llm = self._init_llm()

    def _init_llm(self) -> Any:
        """Initializes the underlying LangChain LLM client."""
        if self.provider == "openrouter":
            from langchain_openai import ChatOpenAI
            api_key = Config.OPENROUTER_API_KEY
            if not api_key:
                print("ℹ️  OPENROUTER_API_KEY not set. Running in Local Grounded Extractive Mode.")
                return None
            model = self.model_name if self.model_name != "auto" else "openai/gpt-4o-mini"
            print(f" Initializing OpenRouter Model ('{model}')...")
            return ChatOpenAI(
                model=model,
                temperature=self.temperature,
                api_key=api_key,
                base_url=Config.OPENROUTER_BASE_URL,
                default_headers={
                    "HTTP-Referer": "https://github.com/bnhs-rag",
                    "X-Title": "BNHS RAG Pipeline",
                },
            )

        elif self.provider == "openai":
            from langchain_openai import ChatOpenAI
            api_key = Config.OPENAI_API_KEY
            if not api_key:
                print("ℹ️  OPENAI_API_KEY not set. Running in Local Grounded Extractive Mode.")
                return None
            model = self.model_name if self.model_name != "auto" else "gpt-4o-mini"
            print(f" Initializing OpenAI Chat Model ('{model}')...")
            return ChatOpenAI(model=model, temperature=self.temperature, api_key=api_key)

        elif self.provider in ("gemini", "google"):
            from langchain_google_genai import ChatGoogleGenerativeAI
            api_key = Config.GOOGLE_API_KEY
            if not api_key:
                print("ℹ️  GOOGLE_API_KEY / GEMINI_API_KEY not set. Running in Local Grounded Extractive Mode.")
                return None
            model = self.model_name if self.model_name != "auto" else "gemini-1.5-flash"
            print(f" Initializing Google Gemini Model ('{model}')...")
            return ChatGoogleGenerativeAI(model=model, temperature=self.temperature, google_api_key=api_key)

        elif self.provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            api_key = Config.ANTHROPIC_API_KEY
            if not api_key:
                print("ℹ️  ANTHROPIC_API_KEY not set. Running in Local Grounded Extractive Mode.")
                return None
            model = self.model_name if self.model_name != "auto" else "claude-3-5-haiku-20241022"
            print(f" Initializing Anthropic Claude Model ('{model}')...")
            return ChatAnthropic(model=model, temperature=self.temperature, api_key=api_key)

        elif self.provider == "ollama":
            try:
                from langchain_community.chat_models import ChatOllama
                model = self.model_name if self.model_name != "auto" else "llama3.2"
                print(f" Initializing Ollama Local Model ('{model}')...")
                return ChatOllama(model=model, base_url=Config.OLLAMA_BASE_URL, temperature=self.temperature)
            except Exception as e:
                print(f"⚠️ Could not connect to Ollama ({e}). Running in Local Grounded Extractive Mode.")
                return None

        else:
            # Local Extractive / Fallback mode
            return None

    def _extract_grounded_fallback_answer(self, question: str, documents: List[Document]) -> str:
        """Extracts direct grounded facts from retrieved context when running offline/local."""
        if not documents:
            return INSUFFICIENT_INFO_MESSAGE

        # Filter stopwords
        stopwords = {
            "what", "which", "where", "when", "does", "have", "with", "from",
            "about", "this", "that", "bnhs", "is", "are", "the", "a", "an",
            "in", "on", "at", "for", "to", "of", "and", "or", "how", "can",
            "do", "you", "i", "tell", "me", "price", "cost", "much", "many"
        }
        raw_words = re.findall(r"\b[a-zA-Z0-9_-]{3,}\b", question.lower())
        query_words = [w for w in raw_words if w not in stopwords]
        
        if not query_words:
            query_words = raw_words

        if not query_words:
            return INSUFFICIENT_INFO_MESSAGE

        scored_paragraphs = []
        matched_query_terms_global = set()

        for doc in documents:
            paragraphs = [p.strip() for p in doc.page_content.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [doc.page_content.strip()]

            for para in paragraphs:
                para_lower = para.lower()
                matched_terms = {w for w in query_words if w in para_lower}
                matched_query_terms_global.update(matched_terms)
                
                match_count = len(matched_terms)
                is_question_list = "?" in para and para.count("?") > 1
                score = match_count * (0.2 if is_question_list else 1.0)

                if match_count > 0:
                    scored_paragraphs.append((score, match_count, para, doc.metadata.get("page", 1)))

        coverage_ratio = len(matched_query_terms_global) / max(len(query_words), 1)
        if coverage_ratio < 0.4:
            return INSUFFICIENT_INFO_MESSAGE

        if not scored_paragraphs:
            return INSUFFICIENT_INFO_MESSAGE

        scored_paragraphs.sort(key=lambda x: (x[0], x[1]), reverse=True)
        
        if scored_paragraphs[0][1] == 0:
            return INSUFFICIENT_INFO_MESSAGE

        top_paragraphs = []
        seen = set()
        for score, match_count, para, page in scored_paragraphs:
            clean_para = " ".join([l.strip() for l in para.split("\n") if l.strip()])
            if clean_para not in seen and not clean_para.endswith("?"):
                seen.add(clean_para)
                top_paragraphs.append(clean_para)
            if len(top_paragraphs) >= 2:
                break

        if not top_paragraphs:
            return INSUFFICIENT_INFO_MESSAGE

        return "\n\n".join(top_paragraphs)

    def generate_answer(
        self,
        question: str,
        retrieved_documents: List[Document],
    ) -> Dict[str, Any]:
        """Generates a grounded response using the retrieved documents."""
        sources = []
        seen_sources = set()

        for doc in retrieved_documents:
            source = doc.metadata.get("source", "BNHS Knowledge Base")
            page = doc.metadata.get("page", 1)
            section = doc.metadata.get("section", "General")
            key = (source, page, section)
            if key not in seen_sources:
                seen_sources.add(key)
                sources.append({
                    "document": source,
                    "page": page,
                    "section": section,
                })

        if not retrieved_documents:
            return {
                "answer": INSUFFICIENT_INFO_MESSAGE,
                "sources": [],
                "grounded": True,
                "provider": self.provider,
            }

        # Format context
        context_blocks = []
        for doc in retrieved_documents:
            p = doc.metadata.get("page", "Unknown")
            sec = doc.metadata.get("section", "General")
            context_blocks.append(f"[Page {p} - {sec}]\n{doc.page_content}")
        
        formatted_context = "\n\n".join(context_blocks)

        # External LLM invocation
        if self.llm is not None:
            try:
                user_content = USER_PROMPT_TEMPLATE.format(
                    context=formatted_context,
                    question=question,
                )
                messages = [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=user_content),
                ]
                response = self.llm.invoke(messages)
                raw_answer = response.content.strip()

                if not raw_answer:
                    raw_answer = INSUFFICIENT_INFO_MESSAGE

                is_insufficient = INSUFFICIENT_INFO_MESSAGE.lower() in raw_answer.lower()
                return {
                    "answer": raw_answer,
                    "sources": [] if is_insufficient else sources,
                    "grounded": True,
                    "provider": self.provider,
                }
            except Exception as e:
                print(f"⚠️ LLM API invocation note: {e}. Utilizing grounded extractive fallback.")
                answer = self._extract_grounded_fallback_answer(question, retrieved_documents)
                is_insufficient = (answer == INSUFFICIENT_INFO_MESSAGE)
                return {
                    "answer": answer,
                    "sources": [] if is_insufficient else sources,
                    "grounded": True,
                    "provider": "local_fallback",
                }

        # Offline / Local fallback mode
        answer = self._extract_grounded_fallback_answer(question, retrieved_documents)
        is_insufficient = (answer == INSUFFICIENT_INFO_MESSAGE)
        return {
            "answer": answer,
            "sources": [] if is_insufficient else sources,
            "grounded": True,
            "provider": "local_fallback",
        }


if __name__ == "__main__":
    from src.retriever import BNHSRetriever
    retriever = BNHSRetriever()
    generator = BNHSGenerator()

    for q in ["What is BNHS-SEVA?", "What is the price of Tesla Model 3 in Tokyo?"]:
        docs = retriever.retrieve(q, top_k=3)
        res = generator.generate_answer(q, docs)
        print("=" * 60)
        print(f"Question: {q}")
        print(f"Answer: {res['answer']}")
        print(f"Sources: {res['sources']}")
