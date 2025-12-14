from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os, sys, yaml, torch
from dotenv import load_dotenv
from typing import List

from utils.db import SessionLocal
from models.chunk import ChunkModel
from models.embedding import EmbeddingModel

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings

router = APIRouter(prefix="/api/embed", tags=["Embedding"])

# ==============================
# DB Dependency
# ==============================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================
# Project root
# ==============================
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

load_dotenv()

# ==============================
# Load config.yaml
# ==============================
config_path = os.path.join(ROOT_DIR, "config", "config.yaml")
with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

def resolve_env_vars(d):
    if isinstance(d, dict):
        return {k: resolve_env_vars(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [resolve_env_vars(v) for v in d]
    elif isinstance(d, str) and d.startswith("${") and d.endswith("}"):
        return os.getenv(d[2:-1], "")
    return d

config = resolve_env_vars(config)

# ==============================
# Embeddings
# ==============================
embedding_cfg = config["embeddings"]

if embedding_cfg["model"] == "openai":
    embeddings = OpenAIEmbeddings(
        model=embedding_cfg["openai"]["model_name"],
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

elif embedding_cfg["model"] == "huggingface":
    device = embedding_cfg["huggingface"].get("device", "cpu")
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"

    embeddings = HuggingFaceEmbeddings(
        model_name=embedding_cfg["huggingface"]["model_name"],
        model_kwargs={"device": device},
        encode_kwargs={"normalize_embeddings": True}
    )

else:
    raise RuntimeError("Embedding model tidak didukung")

# ==============================
# ChromaDB
# ==============================
chroma_cfg = config["vectordb"]["chroma"]
vectorstore = Chroma(
    collection_name=chroma_cfg["collection_name"],
    persist_directory=chroma_cfg["persist_directory"],
    embedding_function=embeddings
)

# ==============================
# API: Embed pending chunks
# ==============================
@router.post("/")
def embed_chunks(limit: int = 100, db: Session = Depends(get_db)):

    chunks = (
        db.query(ChunkModel)
        .filter(ChunkModel.status == "pending")
        .limit(limit)
        .all()
    )

    if not chunks:
        return {"message": "No pending chunks"}

    documents: List[Document] = []

    for chunk in chunks:
        content = chunk.content
        metadata = chunk.metadata_json or {}

        # 1️⃣ generate vector
        vector = embeddings.embed_query(content)

        # 2️⃣ simpan embedding ke DB
        db.add(
            EmbeddingModel(
                chunk_id=chunk.id,
                vector=vector
            )
        )

        # 3️⃣ siapkan untuk chroma
        documents.append(
            Document(
                page_content=content,
                metadata=metadata
            )
        )

        # update status
        chunk.status = "embedded"

    db.commit()

    # 4️⃣ add ke chroma (append only)
    vectorstore.add_documents(documents)

    return {
        "message": "Chunks embedded & added to Knowledge Base",
        "total_chunks": len(chunks)
    }
