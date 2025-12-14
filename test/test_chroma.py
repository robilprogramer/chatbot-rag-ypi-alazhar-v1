import sys
import os
import yaml
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings

# ==============================
# Setup project root
# ==============================
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

# ==============================
# Load .env
# ==============================
load_dotenv()

# ==============================
# Load config.yaml
# ==============================
config_path = os.path.join(ROOT_DIR, "config", "config.yaml")
if not os.path.exists(config_path):
    raise FileNotFoundError(f"Config file not found: {config_path}")

with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

# ==============================
# Helper: resolve env vars in config
# ==============================
def resolve_env_vars(d):
    if isinstance(d, dict):
        return {k: resolve_env_vars(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [resolve_env_vars(v) for v in d]
    elif isinstance(d, str) and d.startswith("${") and d.endswith("}"):
        return os.getenv(d[2:-1], "")
    else:
        return d

config = resolve_env_vars(config)

# ==============================
# Setup embeddings
# ==============================
embedding_cfg = config["embeddings"]
if embedding_cfg["model"] == "openai":
    model_name = embedding_cfg["openai"]["model_name"]
    embeddings = OpenAIEmbeddings(
        model=model_name,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
elif embedding_cfg["model"] == "huggingface":
    model_name = embedding_cfg["huggingface"]["model_name"]
    device = embedding_cfg["huggingface"].get("device", "cpu")
    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs={'device': device},
        encode_kwargs={'normalize_embeddings': True}
    )
else:
    raise NotImplementedError(f"Model embeddings {embedding_cfg['model']} belum didukung.")

# ==============================
# Setup ChromaDB
# ==============================
chroma_cfg = config["vectordb"]["chroma"]
vectorstore = Chroma(
    collection_name=chroma_cfg["collection_name"],
    embedding_function=embeddings,
    persist_directory=chroma_cfg["persist_directory"]
)

# ==============================
# Tampilkan semua dokumen
# ==============================
docs = vectorstore._collection.get(include=["documents", "metadatas", "embeddings"])

print("=== DOCUMENTS IN VECTOR STORE ===")
for idx, (content, metadata) in enumerate(zip(docs["documents"], docs["metadatas"])):
    print(f"ID       : {idx}")
    print(f"Content  : {content[:100]}{'...' if len(content) > 100 else ''}")
    print(f"Metadata : {metadata}")
    print("-"*60)

print(f"\nTotal documents: {len(docs['documents'])}")
