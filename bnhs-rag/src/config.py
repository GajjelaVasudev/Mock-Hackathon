"""Configuration settings for the BNHS RAG Pipeline.
Loads environment variables and sets defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from project root or base dir
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)


class Config:
    # Project paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / os.getenv("DATA_DIR", "data")
    DEFAULT_PDF_PATH: Path = DATA_DIR / os.getenv("PDF_FILENAME", "BNHS_Master_Clean_RAG_Knowledge_Base_25_Pages.pdf")
    VECTORSTORE_DIR: Path = BASE_DIR / os.getenv("VECTORSTORE_DIR", "vectorstore/chroma_db")
    VECTORSTORE_TYPE: str = os.getenv("VECTORSTORE_TYPE", "chroma").lower()  # "chroma" or "faiss"

    # Chunking Configuration
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "600"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))

    # Embedding Configuration
    # Options: "huggingface", "openai"
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "huggingface").lower()
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    # Retrieval Configuration
    TOP_K: int = int(os.getenv("TOP_K", "4"))
    RETRIEVAL_SEARCH_TYPE: str = os.getenv("RETRIEVAL_SEARCH_TYPE", "similarity")  # "similarity" or "mmr"

    # LLM Generation Configuration
    # Options: "openrouter", "openai", "gemini", "anthropic", "ollama", "auto"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto").lower()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "auto")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "1024"))

    # API Keys & Endpoints
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    @classmethod
    def get_active_llm_provider(cls) -> str:
        """Determines the active LLM provider based on configuration and available API keys."""
        if cls.LLM_PROVIDER != "auto":
            return cls.LLM_PROVIDER

        # Auto-detection priority
        if cls.OPENROUTER_API_KEY:
            return "openrouter"
        elif cls.OPENAI_API_KEY:
            return "openai"
        elif cls.GOOGLE_API_KEY:
            return "gemini"
        elif cls.ANTHROPIC_API_KEY:
            return "anthropic"
        else:
            return "local_fallback"
