"""BNHS RAG Interactive Command-Line Interface (CLI).
Allows interactive question-answering, batch testing, and single query execution
against the Bombay Natural History Society knowledge base.
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.config import Config
from src.rag_pipeline import BNHSRAGPipeline, RAGResponse

# ANSI Color codes for clean terminal output
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


SAMPLE_QUESTIONS = [
    "What is BNHS-SEVA?",
    "What activities are available for birdwatchers?",
    "What is the Matheran Herpetofauna Camp?",
    "What conservation work does BNHS do for vultures?",
    "What is e-Mammal India?",
    "What are the different BNHS membership categories?",
    "What research does BNHS conduct on the Great Indian Bustard?",
    "What are the rules regarding membership subscription and withdrawal?",
]


def print_banner():
    """Prints a styled banner for BNHS RAG Pipeline."""
    banner = f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════════════════════════════╗
║               BOMBAY NATURAL HISTORY SOCIETY (BNHS)                  ║
║                  Retrieval-Augmented Generation                      ║
║                     Knowledge-Base Assistant                         ║
╚══════════════════════════════════════════════════════════════════════╝{RESET}
{YELLOW}Knowledge Base:{RESET} {Config.DEFAULT_PDF_PATH.name}
{YELLOW}Embeddings:{RESET}     {Config.EMBEDDING_PROVIDER} ({Config.EMBEDDING_MODEL})
{YELLOW}Vector Store:{RESET}   {Config.VECTORSTORE_TYPE.upper()} ({Config.VECTORSTORE_DIR})
{YELLOW}Active LLM:{RESET}     {Config.get_active_llm_provider()}
────────────────────────────────────────────────────────────────────────
Type your question below, or type {BOLD}'examples'{RESET}, {BOLD}'reindex'{RESET}, or {BOLD}'exit'{RESET}.
"""
    print(banner)


def display_rag_response(response: RAGResponse, show_chunks: bool = False):
    """Formats and prints the RAG answer and source citations."""
    print(f"\n{GREEN}{BOLD}Answer:{RESET}")
    print(f"{response.answer}\n")

    print(f"{BLUE}{BOLD}Sources:{RESET}")
    if response.sources:
        for src in response.sources:
            doc_name = src.get("document", "BNHS Knowledge Base")
            page = src.get("page", "?")
            section = src.get("section", "General")
            print(f" • {doc_name}  {CYAN}(Page {page} — {section}){RESET}")
    else:
        print(" • No direct document source cited.")

    if show_chunks and response.context_chunks:
        print(f"\n{YELLOW}{BOLD}Retrieved Context Chunks ({len(response.context_chunks)}):{RESET}")
        for i, chunk in enumerate(response.context_chunks, 1):
            p = chunk.metadata.get("page", "?")
            sec = chunk.metadata.get("section", "General")
            print(f"\n--- [Chunk {i} | Page {p} | {sec}] ---")
            print(chunk.page_content)

    print("\n" + "─" * 72)


def run_interactive_loop(pipeline: BNHSRAGPipeline, top_k: int = Config.TOP_K):
    """Runs the interactive CLI chat loop."""
    print_banner()

    while True:
        try:
            prompt_str = f"{BOLD}{CYAN}bnhs-rag > {RESET}"
            user_input = input(prompt_str).strip()

            if not user_input:
                continue

            lowered = user_input.lower()
            if lowered in ("exit", "quit", "q"):
                print(f"\n{GREEN}Thank you for using the BNHS Knowledge Base Assistant. Goodbye!{RESET}\n")
                break

            elif lowered == "examples":
                print(f"\n{YELLOW}{BOLD}Sample Questions you can ask:{RESET}")
                for i, q in enumerate(SAMPLE_QUESTIONS, 1):
                    print(f" {i}. {q}")
                print()
                continue

            elif lowered == "reindex":
                print(f"\n{YELLOW}Reindexing BNHS Knowledge Base...{RESET}")
                count = pipeline.index_knowledge_base(force_reindex=True)
                print(f"{GREEN} Successfully reindexed {count} chunks.{RESET}\n")
                continue

            elif lowered == "help":
                print(f"""
{BOLD}Commands:{RESET}
  {CYAN}examples{RESET} - Display a list of sample questions
  {CYAN}reindex{RESET}  - Re-read PDF and rebuild the vector store index
  {CYAN}exit / q{RESET} - Quit the application
""")
                continue

            print(f"\n{YELLOW}Retrieving context and generating grounded answer...{RESET}")
            resp = pipeline.query(user_input, top_k=top_k)
            display_rag_response(resp)

        except KeyboardInterrupt:
            print(f"\n\n{GREEN}Session ended. Goodbye!{RESET}\n")
            break
        except Exception as e:
            print(f"\n{RED}Error processing query: {e}{RESET}\n")


def run_batch_test(pipeline: BNHSRAGPipeline, top_k: int = Config.TOP_K):
    """Runs automated evaluation on test questions."""
    print(f"\n{CYAN}{BOLD}========================================================================{RESET}")
    print(f"{CYAN}{BOLD}              RUNNING BNHS RAG EVALUATION SUITE                         {RESET}")
    print(f"{CYAN}{BOLD}========================================================================{RESET}\n")

    for idx, question in enumerate(SAMPLE_QUESTIONS, 1):
        print(f"\n{BOLD}{YELLOW}[Test {idx}/{len(SAMPLE_QUESTIONS)}] Question:{RESET} {BOLD}{question}{RESET}")
        resp = pipeline.query(question, top_k=top_k)
        display_rag_response(resp)

    print(f"\n{GREEN}{BOLD} Evaluation complete: All {len(SAMPLE_QUESTIONS)} queries tested successfully.{RESET}\n")


def main():
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Bombay Natural History Society (BNHS) RAG Pipeline CLI"
    )
    parser.add_argument(
        "--query", "-q",
        type=str,
        help="Run a single question and exit.",
    )
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Run automated batch test on sample BNHS questions.",
    )
    parser.add_argument(
        "--reindex", "-r",
        action="store_true",
        help="Force reindexing of the PDF into the vector store.",
    )
    parser.add_argument(
        "--top-k", "-k",
        type=int,
        default=Config.TOP_K,
        help=f"Number of chunks to retrieve (default: {Config.TOP_K}).",
    )
    parser.add_argument(
        "--pdf",
        type=str,
        default=None,
        help="Path to alternative PDF file.",
    )

    args = parser.parse_args()

    # Initialize Pipeline
    pipeline = BNHSRAGPipeline(
        pdf_path=args.pdf,
        top_k=args.top_k,
    )

    if args.reindex:
        print(f"{YELLOW}Reindexing vector store...{RESET}")
        count = pipeline.index_knowledge_base(pdf_path=args.pdf, force_reindex=True)
        print(f"{GREEN}Indexed {count} chunks.{RESET}")
        if not args.query and not args.test:
            return

    if args.test:
        run_batch_test(pipeline, top_k=args.top_k)
    elif args.query:
        resp = pipeline.query(args.query, top_k=args.top_k)
        display_rag_response(resp)
    else:
        run_interactive_loop(pipeline, top_k=args.top_k)


if __name__ == "__main__":
    main()
