"""BNHS Retrieval Module.
Loads the persisted vector database and performs semantic similarity or MMR search
to fetch relevant knowledge-base chunks along with page and section metadata.
"""

from pathlib import Path
from typing import List, Optional, Tuple, Union
from langchain_core.documents import Document

from src.config import Config
from src.embeddings import get_embedding_model, load_vectorstore


class BNHSRetriever:
    """Retrieval engine for the Bombay Natural History Society knowledge base."""

    def __init__(
        self,
        vectorstore=None,
        persist_directory: Optional[Union[Path, str]] = None,
        store_type: Optional[str] = None,
        top_k: int = Config.TOP_K,
        search_type: str = Config.RETRIEVAL_SEARCH_TYPE,
    ):
        """Initializes the retriever.
        
        Args:
            vectorstore: Optional pre-loaded VectorStore instance.
            persist_directory: Path to vector store if loading from disk.
            store_type: 'chroma' or 'faiss'.
            top_k: Default number of relevant chunks to retrieve.
            search_type: 'similarity' or 'mmr'.
        """
        self.top_k = top_k
        self.search_type = search_type
        self.store_type = (store_type or Config.VECTORSTORE_TYPE).lower()

        if vectorstore is not None:
            self.vectorstore = vectorstore
        else:
            emb_model = get_embedding_model()
            self.vectorstore = load_vectorstore(
                persist_directory=persist_directory,
                store_type=self.store_type,
                embedding_model=emb_model,
            )

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
    ) -> List[Document]:
        """Retrieves top_k relevant document chunks for a natural language query.
        
        Args:
            query: User's question or search phrase.
            top_k: Optional override for number of documents.
            
        Returns:
            List of retrieved Document objects.
        """
        k = top_k if top_k is not None else self.top_k

        if not query or not query.strip():
            return []

        if self.search_type == "mmr" and hasattr(self.vectorstore, "max_marginal_relevance_search"):
            return self.vectorstore.max_marginal_relevance_search(query, k=k)
        else:
            return self.vectorstore.similarity_search(query, k=k)

    def retrieve_with_scores(
        self,
        query: str,
        top_k: Optional[int] = None,
    ) -> List[Tuple[Document, float]]:
        """Retrieves top_k chunks along with their similarity/distance scores.
        
        Args:
            query: User's question.
            top_k: Optional override for number of documents.
            
        Returns:
            List of (Document, score) tuples.
        """
        k = top_k if top_k is not None else self.top_k

        if not query or not query.strip():
            return []

        if hasattr(self.vectorstore, "similarity_search_with_score"):
            return self.vectorstore.similarity_search_with_score(query, k=k)
        else:
            docs = self.retrieve(query, top_k=k)
            return [(d, 0.0) for d in docs]

    @staticmethod
    def format_context_for_llm(documents: List[Document]) -> str:
        """Formats retrieved documents into a clean context string for prompt injection."""
        if not documents:
            return "No relevant context found."

        context_blocks = []
        for idx, doc in enumerate(documents, start=1):
            source = doc.metadata.get("source", "BNHS Knowledge Base")
            page = doc.metadata.get("page", "Unknown")
            section = doc.metadata.get("section", "General")
            
            block = (
                f"[Document: {source} | Page: {page} | Section: {section}]\n"
                f"{doc.page_content}"
            )
            context_blocks.append(block)

        return "\n\n---\n\n".join(context_blocks)


def retrieve_chunks(
    query: str,
    top_k: int = Config.TOP_K,
    persist_directory: Optional[Union[Path, str]] = None,
) -> List[Document]:
    """Convenience functional wrapper for retrieving chunks."""
    retriever = BNHSRetriever(persist_directory=persist_directory, top_k=top_k)
    return retriever.retrieve(query, top_k=top_k)


if __name__ == "__main__":
    test_queries = [
        "What is BNHS-SEVA?",
        "What is the Matheran Herpetofauna Camp?",
        "What conservation work does BNHS do for vultures?",
    ]
    retriever = BNHSRetriever()
    for q in test_queries:
        print("=" * 60)
        print(f"Query: {q}")
        docs = retriever.retrieve(q, top_k=2)
        for i, d in enumerate(docs, 1):
            print(f"\nChunk {i} [Page {d.metadata.get('page')} | {d.metadata.get('section')}]:")
            print(d.page_content[:200] + "...")
