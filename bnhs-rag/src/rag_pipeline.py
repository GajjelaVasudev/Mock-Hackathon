"""BNHS RAG Pipeline Orchestrator.
Unified end-to-end RAG interface connecting ingestion, vector retrieval,
context formatting, and grounded LLM answer generation.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from langchain_core.documents import Document

from src.config import Config
from src.embeddings import create_or_update_vectorstore, get_embedding_model, is_vectorstore_persisted, load_vectorstore
from src.generator import BNHSGenerator, INSUFFICIENT_INFO_MESSAGE
from src.ingestion import ingest_pdf
from src.retriever import BNHSRetriever


@dataclass
class RAGResponse:
    """Structured response container for RAG queries."""
    query: str
    answer: str
    sources: List[Dict[str, Any]] = field(default_factory=list)
    context_chunks: List[Document] = field(default_factory=list)
    provider: str = "auto"
    grounded: bool = True

    def formatted_sources(self) -> str:
        """Returns pretty-printed sources list."""
        if not self.sources:
            return "No sources cited (insufficient context or general query)."
        lines = []
        for s in self.sources:
            lines.append(f"- {s.get('document', 'BNHS Knowledge Base')} (Page {s.get('page', '?')}: {s.get('section', 'General')})")
        return "\n".join(lines)


class BNHSRAGPipeline:
    """Master RAG pipeline orchestrator for Bombay Natural History Society."""

    def __init__(
        self,
        pdf_path: Optional[Union[Path, str]] = None,
        persist_directory: Optional[Union[Path, str]] = None,
        store_type: Optional[str] = None,
        llm_provider: Optional[str] = None,
        llm_model: Optional[str] = None,
        top_k: int = Config.TOP_K,
        auto_index_if_missing: bool = True,
    ):
        """Initializes the BNHS RAG Pipeline.
        
        Args:
            pdf_path: Target BNHS knowledge base PDF file path.
            persist_directory: Custom vector store directory path.
            store_type: 'chroma' or 'faiss'.
            llm_provider: 'openai', 'gemini', 'anthropic', 'ollama', or 'auto'.
            llm_model: Specific model name for the LLM.
            top_k: Number of chunks to retrieve per query.
            auto_index_if_missing: If True, automatically ingests and indexes if store not found.
        """
        self.pdf_path = Path(pdf_path) if pdf_path else Config.DEFAULT_PDF_PATH
        self.persist_directory = Path(persist_directory) if persist_directory else Config.VECTORSTORE_DIR
        self.store_type = (store_type or Config.VECTORSTORE_TYPE).lower()
        self.top_k = top_k

        # Initialize Embedding model
        self.embedding_model = get_embedding_model()

        # Check or create vectorstore
        if not is_vectorstore_persisted(self.persist_directory, self.store_type):
            if auto_index_if_missing:
                print(f"📦 Vector store not found at '{self.persist_directory}'. Ingesting and indexing PDF now...")
                self.index_knowledge_base(force_reindex=False)
            else:
                raise FileNotFoundError(
                    f"Vector store not found at '{self.persist_directory}'. "
                    "Run index_knowledge_base() first or set auto_index_if_missing=True."
                )

        # Initialize Retriever and Generator
        self.retriever = BNHSRetriever(
            persist_directory=self.persist_directory,
            store_type=self.store_type,
            top_k=self.top_k,
        )
        self.generator = BNHSGenerator(
            provider=llm_provider,
            model_name=llm_model,
        )

    def index_knowledge_base(
        self,
        pdf_path: Optional[Union[Path, str]] = None,
        force_reindex: bool = True,
    ) -> int:
        """Loads the BNHS PDF, chunks it, and builds/updates the vector store.
        
        Args:
            pdf_path: Path to the target PDF.
            force_reindex: Whether to wipe and re-create existing vectorstore.
            
        Returns:
            Number of indexed chunks.
        """
        target_pdf = Path(pdf_path) if pdf_path else self.pdf_path
        chunks = ingest_pdf(target_pdf)
        create_or_update_vectorstore(
            documents=chunks,
            persist_directory=self.persist_directory,
            store_type=self.store_type,
            embedding_model=self.embedding_model,
            force_reindex=force_reindex,
        )
        # Refresh retriever instance
        self.retriever = BNHSRetriever(
            persist_directory=self.persist_directory,
            store_type=self.store_type,
            top_k=self.top_k,
        )
        return len(chunks)

    def query(self, question: str, top_k: Optional[int] = None) -> RAGResponse:
        """Executes the complete RAG pipeline for a given user query.
        
        Step 1: Similarity / Semantic Retrieval from Vector Store
        Step 2: Context Formatting & Grounding Validation
        Step 3: LLM Generation
        Step 4: Source Attribution and Packaging
        
        Args:
            question: User's natural language question.
            top_k: Optional override for number of retrieved chunks.
            
        Returns:
            RAGResponse object with answer, sources, and context chunks.
        """
        cleaned_question = question.strip()
        if not cleaned_question:
            return RAGResponse(
                query=question,
                answer="Please provide a valid non-empty question.",
                sources=[],
                context_chunks=[],
            )

        # 1. Retrieve relevant chunks
        k = top_k if top_k is not None else self.top_k
        retrieved_docs = self.retriever.retrieve(cleaned_question, top_k=k)

        # 2. Generate grounded answer
        gen_result = self.generator.generate_answer(cleaned_question, retrieved_docs)

        # 3. Build structured response
        return RAGResponse(
            query=cleaned_question,
            answer=gen_result["answer"],
            sources=gen_result["sources"],
            context_chunks=retrieved_docs,
            provider=gen_result.get("provider", self.generator.provider),
            grounded=gen_result.get("grounded", True),
        )


def query_bnhs(question: str, top_k: int = Config.TOP_K) -> RAGResponse:
    """Convenience helper function to run a single query against BNHS RAG pipeline."""
    pipeline = BNHSRAGPipeline(top_k=top_k)
    return pipeline.query(question, top_k=top_k)


if __name__ == "__main__":
    test_pipeline = BNHSRAGPipeline()
    sample_queries = [
        "What is BNHS-SEVA?",
        "What is the Matheran Herpetofauna Camp?",
        "What conservation work does BNHS do for vultures?",
    ]
    for q in sample_queries:
        print("\n" + "=" * 60)
        print(f"QUESTION: {q}")
        resp = test_pipeline.query(q)
        print(f"\nANSWER:\n{resp.answer}")
        print(f"\nSOURCES:\n{resp.formatted_sources()}")
