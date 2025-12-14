from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from core.config_loader import APP_CONFIG
from core.prompt_manager import get_system_prompt, get_query_prompt

from dotenv import load_dotenv
load_dotenv()

from utils.db import SessionLocal
from repositories.master_repository import MasterRepository
from utils.metadata_extractor import MetadataExtractor, QueryParser
from utils.smart_retriever import SmartRetriever, EnhancedQueryChain
from utils.embeddings import EmbeddingManager, EmbeddingModel

_query_chain = None   # 🔒 singleton


def build_llm():
    llm_cfg = APP_CONFIG["llm"]
    provider = llm_cfg["provider"]

    if provider == "openai":
        cfg = llm_cfg["openai"]
        return ChatOpenAI(
            model=cfg["model"],
            temperature=cfg["temperature"],
            max_tokens=cfg["max_tokens"],
            streaming=cfg["streaming"],
        )

    elif provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        cfg = llm_cfg["gemini"]
        return ChatGoogleGenerativeAI(
            model=cfg["model"],
            temperature=cfg["temperature"],
            max_output_tokens=cfg["max_tokens"],
        )

    elif provider == "ollama":
        from langchain_community.chat_models import ChatOllama
        cfg = llm_cfg["ollama"]
        return ChatOllama(
            model=cfg["model"],
            temperature=cfg["temperature"],
            num_predict=cfg["max_tokens"],
            system=cfg.get("system_prompt_prefix", ""),
        )

    else:
        raise ValueError(f"LLM provider tidak dikenali: {provider}")


def get_query_chain():
    global _query_chain

    if _query_chain is not None:
        return _query_chain

    print("🔄 Initializing RAG (ONCE)")

    # =========================
    # Metadata
    # =========================
    session = SessionLocal()
    master_repo = MasterRepository(session)
    extractor = MetadataExtractor(master_repo)
    parser = QueryParser(extractor)

    # =========================
    # Embeddings
    # =========================
    embedding_manager = EmbeddingManager(
        model_type=EmbeddingModel.HUGGINGFACE,
        config={"model_name": "sentence-transformers/all-MiniLM-L6-v2"},
    )
    embeddings = embedding_manager.get_embeddings()

    # =========================
    # Vector DB
    # =========================
    vectorstore = Chroma(
        collection_name="ypi_knowledge_base",
        embedding_function=embeddings,
        persist_directory="./chroma_db",
    )

    # =========================
    # Retriever
    # =========================
    smart_retriever = SmartRetriever(
        vectorstore=vectorstore,
        query_parser=parser,
        top_k=5,
    )

    # =========================
    # LLM
    # =========================
    llm = build_llm()

    # =========================
    # Query Chain
    # =========================
    _query_chain = EnhancedQueryChain(
        smart_retriever=smart_retriever,
        llm=llm,
        system_prompt=get_system_prompt(),   # ✅ DIPANGGIL
        query_prompt=get_query_prompt(),     # ✅ DIPANGGIL
    )

    print("✅ RAG READY")
    return _query_chain
