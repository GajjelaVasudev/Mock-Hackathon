"""Backend API Services Package.
Configures unified namespace resolution for sibling modules (bnhs-rag and recomendation-system).
"""

import sys
import types
from pathlib import Path

# Resolve root paths
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent
RAG_DIR = WORKSPACE_ROOT / "bnhs-rag"
REC_DIR = WORKSPACE_ROOT / "recomendation-system"

rag_src = str(RAG_DIR / "src")
rec_src = str(REC_DIR / "src")

# Configure unified src namespace so both packages can resolve their internal modules
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

from .rag_service import RAGService
from .recommendation_service import RecommendationService

__all__ = ["RAGService", "RecommendationService"]
