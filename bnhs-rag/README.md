# Bombay Natural History Society (BNHS) — RAG Pipeline

A clean, modular, production-ready **Retrieval-Augmented Generation (RAG)** pipeline designed for the Bombay Natural History Society (BNHS) knowledge base.

This pipeline ingests official BNHS documents (annual reports, program outlines, conservation initiatives, and membership bylaws), converts them into semantic embeddings, stores them in a local vector database, retrieves strictly relevant chunks for user queries, and generates grounded answers citing exact pages and sections without hallucination.

---

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│   BNHS Master Knowledge Base (PDF)                     │
└───────────────────────────┬────────────────────────────┘
                            │
                    [ 1. Ingestion ]
                    • Page-by-page text extraction
                    • Header/noise cleaning
                    • Section metadata extraction
                    • Recursive Character Chunking
                            │
                    [ 2. Embeddings ]
                    • HuggingFace all-MiniLM-L6-v2 (default local)
                    • OpenAI text-embedding-3-small (configurable)
                            │
                  [ 3. Vector Database ]
                    • Persistent ChromaDB / FAISS
                    • Smart Index Caching & Re-use
                            │
            ┌───────────────┴───────────────┐
            │ User Natural Language Query   │
            └───────────────┬───────────────┘
                            │
                   [ 4. Retriever ]
                    • Top-K Semantic Similarity / MMR
                    • Metadata Filtering & Context Stitching
                            │
                   [ 5. Generator ]
                    • Strict Grounding System Prompt
                    • Multi-provider: OpenRouter, OpenAI, Gemini, Claude, Ollama, Local Fallback
                    • Anti-hallucination safeguard
                            │
                            ▼
              ┌───────────────────────────┐
              │ Grounded Answer + Sources │
              │ (Document, Page, Section) │
              └───────────────────────────┘
```

---

## Project Structure

```
bnhs-rag/
├── data/
│   └── BNHS_Master_Clean_RAG_Knowledge_Base_25_Pages.pdf
├── vectorstore/
│   └── chroma_db/               # Persisted vector database
├── src/
│   ├── __init__.py
│   ├── config.py                # Centralized configuration & settings
│   ├── ingestion.py             # PDF loading, cleaning & intelligent chunking
│   ├── embeddings.py            # Embedding models & vector store lifecycle
│   ├── retriever.py             # Semantic similarity & context construction
│   ├── generator.py             # Grounded prompt orchestration & multi-LLM support
│   ├── rag_pipeline.py          # Unified end-to-end RAG orchestrator
│   └── main.py                  # Interactive CLI and evaluation runner
├── .env.example                 # Environment configuration template
├── .env                         # Local environment settings
├── requirements.txt             # Python dependencies
└── README.md                    # System documentation and evaluation guide
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.11, 3.12, 3.13)
- pip or conda

### 2. Install Dependencies
```bash
cd bnhs-rag
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Your `.env` is configured with OpenRouter support:
```env
# Vector Database & Embeddings
VECTORSTORE_TYPE=chroma
EMBEDDING_PROVIDER=huggingface
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# LLM Provider Configuration
LLM_PROVIDER=openrouter
LLM_MODEL=openai/gpt-4o-mini
LLM_TEMPERATURE=0.0

# OpenRouter API Key & Base URL
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

> **Supported Models via OpenRouter**: You can freely change `LLM_MODEL` in `.env` to any model available on OpenRouter, such as `openai/gpt-4o-mini`, `meta-llama/llama-3.3-70b-instruct`, `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash-001`, or `mistralai/mistral-large`.

---

## How to Run

### 1. Interactive CLI Mode
Launch the interactive terminal interface:
```bash
python3 src/main.py
```
*Special CLI commands within the interactive session:*
- `examples`: Prints sample questions you can ask.
- `reindex`: Forces a fresh re-ingestion and index rebuild.
- `help`: Shows available commands.
- `exit` or `q`: Exits the CLI.

### 2. Single Query Execution
Run a one-off query directly from the shell:
```bash
python3 src/main.py --query "What is BNHS-SEVA?"
```

### 3. Automated Evaluation Test Suite
Run batch evaluation against standard test queries across all knowledge domains:
```bash
python3 src/main.py --test
```

### 4. Custom Retrieval Top-K
```bash
python3 src/main.py --query "What is the Matheran Herpetofauna Camp?" --top-k 3
```

---

## Core Pipeline Components

### 1. `ingestion.py`
- **Document Loading**: Reads PDF page-by-page using `pypdf`.
- **Text Cleaning**: Removes repeated title headers, page numbers, and raw metadata blocks (`RAG metadata: section=...`).
- **Section Parsing**: Dynamically detects section titles (e.g. `05 — Matheran Herpetofauna Camp`) using regex.
- **Intelligent Chunking**: Splits text into chunks with size 600 characters and 100 character overlap, preserving sentence boundaries and attaching metadata (`source`, `page`, `section`, `chunk_id`).

### 2. `embeddings.py`
- **Configurable Embeddings**:
  - `huggingface` (default): `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, runs locally).
  - `openai`: `text-embedding-3-small` / `text-embedding-ada-002`.
- **Vector Store**: Supports persistent `chroma` and `faiss`.
- **Caching**: Reuses existing disk-persisted vector store without recalculating embeddings on every run.

### 3. `retriever.py`
- Exposes `BNHSRetriever` with `retrieve(query, top_k)` and `retrieve_with_scores(query, top_k)`.
- Supports standard cosine similarity search and Maximal Marginal Relevance (MMR) for diverse retrieval.
- Formats retrieved chunks with page number and section citations for prompt construction.

### 4. `generator.py`
- Uses strict system prompts instructing the LLM to base answers **strictly** on retrieved context.
- **Anti-Hallucination Safeguard**: If the context does not contain sufficient facts to answer the question, the system outputs:
  > *"I could not find sufficient information about this in the BNHS knowledge base."*
- Supports OpenRouter, OpenAI, Google Gemini, Anthropic Claude, Ollama local models, and local extractive fallback.

### 5. `rag_pipeline.py`
- High-level Python API `BNHSRAGPipeline` providing `pipeline.query(question) -> RAGResponse`.
- Returns structured answers, sources list, and underlying context chunks.

---

## Comprehensive Evaluation & Test Queries

The table below outlines sample questions across all major BNHS knowledge domains and their expected source pages:

| # | Domain | Sample Question | Expected Grounded Source |
|---|--------|-----------------|--------------------------|
| 1 | **BNHS Overview** | *What is the Bombay Natural History Society and what is the scope of its work?* | Page 1 (Corpus Guide & Overview), Page 23 (Governance) |
| 2 | **Nature Activities** | *What activities are available for birdwatchers and nature enthusiasts?* | Page 2 (Nature Activities), Page 3 (Tree, Marine Walks) |
| 3 | **Camps & Walks** | *What is the Matheran Herpetofauna Camp and what species are observed?* | Page 5 (Matheran Herpetofauna Camp) |
| 4 | **Education** | *What educational initiatives are conducted at CEC Delhi and CEC Mumbai?* | Page 6 (CEC Mumbai), Page 7 (CEC Delhi & e-Mammal) |
| 5 | **Conservation** | *What conservation work and breeding programs does BNHS operate for vultures?* | Page 15 (Vulture Conservation) |
| 6 | **Threatened Species** | *What research and initiatives does BNHS conduct on the Great Indian Bustard?* | Page 17 (Great Indian Bustard & Lesser Florican) |
| 7 | **Membership** | *What membership categories exist and what privileges do members receive?* | Page 11 (Membership Categories), Page 12 (Member Privileges) |
| 8 | **Volunteering** | *What is BNHS-SEVA and how are volunteers matched with projects?* | Page 13 (BNHS-SEVA & Volunteering) |
| 9 | **Research & Library** | *What are JBNHS and Hornbill, and what does the BNHS Library house?* | Page 21 (Research, Library & Publications) |
| 10 | **Digitisation & AI** | *What is the bird-ringing digitisation project and citizen participation program?* | Page 20 (Digitisation, AI & Citizen Participation) |
| 11 | **Bylaws & Conduct** | *What are the rules regarding annual membership subscriptions and arrears?* | Page 22 (Rules: Subscriptions & Withdrawal) |
| 12 | **Negative Test (Out of scope)** | *What is the price of Tesla Model 3 in Tokyo?* | Returns: *"I could not find sufficient information about this in the BNHS knowledge base."* |

---

## Adding Future Documents

The ingestion system is designed to easily scale beyond the initial 25-page prototype corpus:

1. **Add new PDF files** into the `data/` directory (e.g. `data/BNHS_Annual_Report_2025.pdf` or `data/BNHS_Bird_Walks_Schedule.pdf`).
2. **Ingest new documents** by calling:
   ```python
   from src.rag_pipeline import BNHSRAGPipeline
   pipeline = BNHSRAGPipeline()
   pipeline.index_knowledge_base("data/BNHS_New_Document.pdf", force_reindex=False)
   ```
3. Or re-index all documents via CLI:
   ```bash
   python3 src/main.py --pdf "data/BNHS_New_Document.pdf" --reindex
   ```

---

## Extensibility & Next Steps

This RAG core was built with clean separation of concerns for easy integration into future layers:
- **FastAPI Backend**: Can import `BNHSRAGPipeline` directly into `/api/v1/query` endpoints.
- **MERN Frontend / Chatbot UI**: Can communicate via REST / WebSocket streams with the RAG service.
- **Recommendation Engine**: Can share the ChromaDB vector embeddings for activity recommendation matching.
