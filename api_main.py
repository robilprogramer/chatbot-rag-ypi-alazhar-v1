from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chunking import router as chunking_router
from api.vectorstore_router import router as vectorstore_router
from api.embeding import router as embedding_router  # ⬅️ TAMBAH INI
from api.chat import router as chat_router  # ⬅️ TAMBAH INI
app = FastAPI(
    title="Document Chunking API",
    version="1.0.0"
)

# Mengizinkan semua origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # semua origin diizinkan
    allow_credentials=True,
    allow_methods=["*"],  # semua method (GET, POST, PUT, DELETE, dll)
    allow_headers=["*"],  # semua header
)

app.include_router(chunking_router)        # router untuk chunking
app.include_router(vectorstore_router)     # router untuk mengambil dokumen dari vectorstore
app.include_router(embedding_router)       # /api/embed  ✅ BARU
app.include_router(chat_router)  