"""BNHS Embeddings and Vector Store Management Module.
Supports configurable embedding models (HuggingFace, OpenAI) and vector stores (Chroma, FAISS)
with persistence and caching to avoid unnecessary re-embedding.
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional, Union
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from src.config import Config


def get_embedding_model(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Embeddings:
    """Instantiates and returns the configured embedding model.
    
    Args:
        provider: 'huggingface' or 'openai'. Defaults to Config.EMBEDDING_PROVIDER.
        model_name: Name of model. Defaults to Config.EMBEDDING_MODEL.
        
    Returns:
        LangChain Embeddings instance.
    """
    active_provider = (provider or Config.EMBEDDING_PROVIDER).lower()
    active_model = model_name or Config.EMBEDDING_MODEL

    if active_provider == "openai":
        from langchain_openai import OpenAIEmbeddings
        api_key = Config.OPENAI_API_KEY
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is required when using EMBEDDING_PROVIDER='openai'. "
                "Set it in your .env file or switch to 'huggingface' for local zero-cost embeddings."
            )
        print(f" Initializing OpenAI Embeddings (model: '{active_model}')...")
        return OpenAIEmbeddings(model=active_model, api_key=api_key)

    elif active_provider == "huggingface":
        from langchain_huggingface import HuggingFaceEmbeddings
        print(f" Initializing HuggingFace Embeddings (model: '{active_model}')...")
        return HuggingFaceEmbeddings(
            model_name=active_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    else:
        raise ValueError(
            f"Unsupported embedding provider '{active_provider}'. Supported: ['huggingface', 'openai']."
        )


def get_vectorstore_directory(
    custom_dir: Optional[Union[Path, str]] = None,
    store_type: Optional[str] = None,
) -> Path:
    """Returns the resolved vector store directory path."""
    active_type = (store_type or Config.VECTORSTORE_TYPE).lower()
    if custom_dir:
        return Path(custom_dir)
    
    base_dir = Config.VECTORSTORE_DIR
    if active_type == "faiss" and "chroma" in str(base_dir):
        return Config.BASE_DIR / "vectorstore" / "faiss_index"
    return base_dir


def is_vectorstore_persisted(
    persist_dir: Path,
    store_type: str = "chroma",
) -> bool:
    """Checks if a valid vector store index is already saved on disk."""
    if not persist_dir.exists():
        return False
    
    if store_type == "chroma":
        # Check for sqlite db file or chroma directory contents
        chroma_sqlite = persist_dir / "chroma.sqlite3"
        return chroma_sqlite.exists() or any(persist_dir.iterdir())
    elif store_type == "faiss":
        faiss_file = persist_dir / "index.faiss"
        return faiss_file.exists()

    return False


def create_or_update_vectorstore(
    documents: List[Document],
    persist_directory: Optional[Union[Path, str]] = None,
    store_type: Optional[str] = None,
    embedding_model: Optional[Embeddings] = None,
    force_reindex: bool = False,
):
    """Creates a new vector store or loads the existing persisted one.
    
    Args:
        documents: Document chunks to index if building or updating.
        persist_directory: Custom vectorstore persistence path.
        store_type: 'chroma' or 'faiss'.
        embedding_model: Optional custom embedding instance.
        force_reindex: If True, wipes existing index and creates a fresh one.
        
    Returns:
        Persisted VectorStore instance.
    """
    active_type = (store_type or Config.VECTORSTORE_TYPE).lower()
    target_dir = get_vectorstore_directory(persist_directory, active_type)
    emb_model = embedding_model or get_embedding_model()

    # Reuse existing vectorstore if available and force_reindex is False
    if not force_reindex and is_vectorstore_persisted(target_dir, active_type):
        print(f" Reusing existing persisted {active_type.upper()} vector store at '{target_dir}'.")
        return load_vectorstore(target_dir, active_type, emb_model)

    print(f" Building fresh {active_type.upper()} vector store with {len(documents)} chunks...")
    
    # If forced re-indexing, clear previous directory cleanly
    if force_reindex and target_dir.exists():
        print(f" Clearing old vector store at '{target_dir}'...")
        shutil.rmtree(target_dir, ignore_errors=True)

    target_dir.mkdir(parents=True, exist_ok=True)

    if active_type == "chroma":
        from langchain_chroma import Chroma
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=emb_model,
            persist_directory=str(target_dir),
            collection_name="bnhs_knowledge_base",
        )
        print(f" Successfully saved ChromaDB vector store at '{target_dir}'.")
        return vectorstore

    elif active_type == "faiss":
        from langchain_community.vectorstores import FAISS
        vectorstore = FAISS.from_documents(
            documents=documents,
            embedding=emb_model,
        )
        vectorstore.save_local(str(target_dir))
        print(f" Successfully saved FAISS index at '{target_dir}'.")
        return vectorstore

    else:
        raise ValueError(f"Unsupported vector store type '{active_type}'. Use 'chroma' or 'faiss'.")


def load_vectorstore(
    persist_directory: Optional[Union[Path, str]] = None,
    store_type: Optional[str] = None,
    embedding_model: Optional[Embeddings] = None,
):
    """Loads an existing persisted vector store from disk.
    
    Args:
        persist_directory: Path to vector store directory.
        store_type: 'chroma' or 'faiss'.
        embedding_model: Embedding model instance matching the stored index.
        
    Returns:
        VectorStore instance.
    """
    active_type = (store_type or Config.VECTORSTORE_TYPE).lower()
    target_dir = get_vectorstore_directory(persist_directory, active_type)
    emb_model = embedding_model or get_embedding_model()

    if not is_vectorstore_persisted(target_dir, active_type):
        raise FileNotFoundError(
            f"No persisted {active_type.upper()} vector store found at '{target_dir}'. "
            f"Please run ingestion first (e.g. `python src/ingestion.py` or use pipeline with force_reindex=True)."
        )

    if active_type == "chroma":
        from langchain_chroma import Chroma
        return Chroma(
            persist_directory=str(target_dir),
            embedding_function=emb_model,
            collection_name="bnhs_knowledge_base",
        )

    elif active_type == "faiss":
        from langchain_community.vectorstores import FAISS
        return FAISS.load_local(
            folder_path=str(target_dir),
            embeddings=emb_model,
            allow_dangerous_deserialization=True,
        )

    else:
        raise ValueError(f"Unsupported vector store type '{active_type}'. Use 'chroma' or 'faiss'.")


if __name__ == "__main__":
    from src.ingestion import ingest_pdf
    docs = ingest_pdf()
    vs = create_or_update_vectorstore(docs, force_reindex=True)
    print(" Vector store successfully tested and verified.")
