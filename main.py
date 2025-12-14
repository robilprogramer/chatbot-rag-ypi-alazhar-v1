"""
YPI Al-Azhar RAG Chatbot - Main Application
Features:
- Dynamic LLM provider (OpenAI, Gemini, Ollama)
- Configurable summarization (text, table, image)
- Move processed files to timestamped folders
- Use prompts from prompts.yaml
"""

import os
import sys
import yaml
import shutil
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
from datetime import datetime

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

print("📄 Loading environment variables...")

from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("📄 Loading modules...")

# ============================================================================
# IMPORTS
# ============================================================================

try:
    from utils.pdf_parser import PDFParser, OCRMethod
    print("   ✓ PDF Parser")
except ImportError as e:
    print(f"   ✗ PDF Parser error: {e}")
    sys.exit(1)

try:
    from utils.chunker import TextChunker, ChunkingStrategy
    print("   ✓ Text Chunker")
except ImportError as e:
    print(f"   ✗ Chunker error: {e}")
    sys.exit(1)

try:
    from utils.embeddings import EmbeddingManager, EmbeddingModel
    print("   ✓ Embeddings Manager")
except ImportError as e:
    print(f"   ✗ Embeddings error: {e}")
    sys.exit(1)

try:
    from utils.retriever import RetrieverBuilder, RetrievalMethod
    print("   ✓ Retriever Builder")
except ImportError as e:
    print(f"   ✗ Retriever error: {e}")
    sys.exit(1)

# Content Summarizer - NEW!
try:
    from utils.content_summarizer import ContentSummarizer, SummaryConfig, create_summarizer
    SUMMARIZER_AVAILABLE = True
    print("   ✓ Content Summarizer")
except ImportError as e:
    SUMMARIZER_AVAILABLE = False
    print(f"   ⚠️ Content Summarizer not available: {e}")

print("\n📦 Loading LangChain...")

try:
    from langchain_openai import ChatOpenAI
    print("   ✓ LangChain OpenAI")
except ImportError as e:
    print(f"   ⚠️ LangChain OpenAI not available: {e}")
    ChatOpenAI = None

try:
    from langchain_ollama import ChatOllama
    print("   ✓ LangChain Ollama")
except ImportError as e:
    print(f"   ⚠️ LangChain Ollama not available: {e}")
    ChatOllama = None

try:
    from langchain_google_genai import GoogleGenerativeAI
    print("   ✓ LangChain Google GenAI")
except ImportError as e:
    print(f"   ⚠️ LangChain Google GenAI not available: {e}")
    GoogleGenerativeAI = None

try:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    print("   ✓ LangChain Core")
except ImportError as e:
    print(f"   ✗ LangChain Core error: {e}")
    sys.exit(1)

print("\n✅ All modules loaded!")


# ============================================================================
# CONFIG CLASSES
# ============================================================================

@dataclass
class ChatbotConfig:
    """Configuration for chatbot"""
    mode: str
    ocr_method: str
    chunking_strategy: str
    embedding_model: str
    retrieval_method: str
    llm_provider: str
    llm_model: str
    # Summarization settings
    summarize_text: bool = False
    summarize_tables: bool = True
    summarize_images: bool = True


class ConfigLoader:
    """Load configuration from YAML files"""
    
    @staticmethod
    def load_config(config_path: str = None) -> dict:
        """Load main configuration"""
        if config_path is None:
            config_path = PROJECT_ROOT / "config" / "config.yaml"
        
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @staticmethod
    def load_prompts(prompts_path: str = None) -> dict:
        """Load prompt templates"""
        if prompts_path is None:
            prompts_path = PROJECT_ROOT / "config" / "prompts.yaml"
            
        with open(prompts_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)


# ============================================================================
# TRANSACTIONAL FLOW MANAGER
# ============================================================================

class TransactionalFlowManager:
    """Manage transactional conversation flow"""
    
    def __init__(self, config: dict):
        self.config = config
        self.sessions: Dict[str, dict] = {}
        self.enrollment_steps = config.get('transactional', {}).get('enrollment_steps', [
            "data_pribadi",
            "data_orang_tua", 
            "data_akademik",
            "upload_dokumen",
            "konfirmasi"
        ])
    
    def create_session(self, user_id: str) -> str:
        """Create new enrollment session"""
        import uuid
        session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            "user_id": user_id,
            "current_step": 0,
            "form_data": {},
            "uploaded_docs": [],
            "status": "in_progress"
        }
        
        return session_id
    
    def get_current_step(self, session_id: str) -> str:
        """Get current step name"""
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        step_index = session['current_step']
        if step_index < len(self.enrollment_steps):
            return self.enrollment_steps[step_index]
        return "completed"
    
    def save_step_data(self, session_id: str, data: dict):
        """Save data for current step and advance"""
        session = self.sessions.get(session_id)
        if session:
            session['form_data'].update(data)
            session['current_step'] += 1
            
            if session['current_step'] >= len(self.enrollment_steps):
                session['status'] = "completed"
    
    def get_progress(self, session_id: str) -> dict:
        """Get enrollment progress"""
        session = self.sessions.get(session_id)
        if not session:
            return None
        
        return {
            "session_id": session_id,
            "current_step": self.get_current_step(session_id),
            "progress": f"{session['current_step']}/{len(self.enrollment_steps)}",
            "status": session['status'],
            "form_data": session['form_data']
        }


# ============================================================================
# MAIN CHATBOT CLASS
# ============================================================================

class DualModeRAGChatbot:
    """
    Main Chatbot Application with Dual Modes:
    1. Informational Mode - Q&A based on documents
    2. Transactional Mode - Enrollment process
    
    Features:
    - Dynamic LLM provider (OpenAI, Gemini, Ollama)
    - Configurable summarization (text, table, image)
    - Move processed files to timestamped folders
    - Use prompts from prompts.yaml
    """
    
    def __init__(
        self,
        config_path: str = None,
        # Summarization control
        summarize_text: bool = False,
        summarize_tables: bool = True,
        summarize_images: bool = True
    ):
        # Load configurations
        self.config = ConfigLoader.load_config(config_path)
        self.prompts = ConfigLoader.load_prompts()
        
        # Store summarization settings
        self.summarize_text = summarize_text
        self.summarize_tables = summarize_tables
        self.summarize_images = summarize_images
        
        # Get mode
        self.mode = self.config.get('modes', {}).get('default', 'informational')
        
        # Initialize components based on mode
        self._initialize_components()
        
        # Storage for processed data
        self.retriever = None
        self.processed_documents = []  # Track processed documents
        
        # Flow manager (initialized lazily)
        self.flow_manager = None
        
    def _initialize_components(self):
        """Initialize components based on configuration"""
        
        try:
            # PDF Parser
            print("   📄 Initializing PDF Parser...")
            ocr_method = self.config.get('ocr', {}).get('method', 'unstructured')
            ocr_config = self.config.get('ocr', {}).get(ocr_method, {})
            
            self.pdf_parser = PDFParser(
                output_dir=self.config.get('paths', {}).get('extracted_dir', 'data/extracted_data'),
                ocr_method=OCRMethod(ocr_method),
                config=ocr_config
            )
            print("   ✓ PDF Parser ready")
            
            # Text Chunker
            print("   📄 Initializing Text Chunker...")
            chunking_strategy = self.config.get('chunking', {}).get('strategy', 'fixed_size')
            chunking_config = self.config.get('chunking', {}).get(chunking_strategy, {})
            
            self.chunker = TextChunker(
                strategy=ChunkingStrategy(chunking_strategy),
                chunk_size=chunking_config.get('chunk_size', 1000),
                chunk_overlap=chunking_config.get('chunk_overlap', 200),
                config=chunking_config
            )
            print("   ✓ Text Chunker ready")
            
            # Embeddings
            print("   📄 Initializing Embeddings...")
            embedding_model = self.config.get('embeddings', {}).get('model', 'openai')
            embedding_config = self.config.get('embeddings', {}).get(embedding_model, {})
            
            self.embedding_manager = EmbeddingManager(
                model_type=EmbeddingModel(embedding_model),
                config=embedding_config
            )
            self.embeddings = self.embedding_manager.get_embeddings()
            print("   ✓ Embeddings ready")
            
            # Vector Database / Retriever Builder
            print("   📄 Initializing Vector Database...")
            vectordb_config = self.config.get('vectordb', {}).get('chroma', {
                'collection_name': 'ypi_knowledge_base',
                'persist_directory': './chroma_db'
            })
            
            self.retriever_builder = RetrieverBuilder(
                collection_name=vectordb_config.get('collection_name', 'ypi_knowledge_base'),
                embeddings=self.embeddings,
                persist_directory=vectordb_config.get('persist_directory', './chroma_db'),
                config=self.config.get('retrieval', {})
            )
            print("   ✓ Vector Database ready")
            
            # LLM - Dynamic Provider
            print("   📄 Initializing LLM...")
            llm_provider = self.config.get('llm', {}).get('provider', 'openai')
            llm_config = self.config.get('llm', {}).get(llm_provider, {})
            
            self.llm = self._create_llm(llm_provider, llm_config)
            print(f"   ✓ LLM ready ({llm_provider})")
            
            # Content Summarizer
            self.content_summarizer = None
            if SUMMARIZER_AVAILABLE:
                print("   📄 Initializing Content Summarizer...")
                self.content_summarizer = create_summarizer(
                    config=self.config,
                    prompts=self.prompts,
                    summarize_text=self.summarize_text,
                    summarize_tables=self.summarize_tables,
                    summarize_images=self.summarize_images
                )
                print("   ✓ Content Summarizer ready")
            
            # AUTO-LOAD EXISTING RETRIEVER FROM CHROMADB
            print("\n📚 Checking for existing documents...")
            if self.retriever_builder.has_existing_documents():
                print("   ✅ Found existing documents in ChromaDB!")
                self._load_existing_retriever()
            else:
                print("   ℹ️ No existing documents found. Upload PDF to start.")
            
            print("\n✅ All components initialized successfully!")
            
        except Exception as e:
            print(f"\n✗ Error during initialization: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _load_existing_retriever(self):
        """
        Load retriever dari dokumen yang sudah ada di ChromaDB
        Dipanggil otomatis saat initialization jika ada existing docs
        """
        retrieval_config = self.config.get('retrieval', {})
        hybrid_config = retrieval_config.get('hybrid', {})
        
        self.retriever = self.retriever_builder.load_existing_retriever(
            top_k=retrieval_config.get('top_k', 5),
            use_hybrid=(retrieval_config.get('method', 'hybrid') == 'hybrid'),
            dense_weight=hybrid_config.get('dense_weight', 0.7),
            bm25_weight=hybrid_config.get('bm25_weight', 0.3)
        )
        
        if self.retriever:
            stats = self.retriever_builder.get_collection_stats()
            sources = self.retriever_builder.list_all_sources()
            
            # Track loaded documents
            self.processed_documents = [{
                'name': src,
                'timestamp': 'Pre-loaded',
                'folder': 'ChromaDB',
                'chunks': stats.get('document_count', 0) // max(len(sources), 1),
                'status': 'loaded'
            } for src in sources]
            
            print(f"   📂 Loaded sources: {sources}")
    
    def reload_from_chromadb(self):
        """
        Manual method untuk reload retriever dari ChromaDB
        Bisa dipanggil kapan saja jika ada perubahan
        """
        print("\n🔄 Reloading retriever from ChromaDB...")
        self._load_existing_retriever()
        return self.retriever is not None
    
    def _create_llm(self, provider: str, config: dict):
        """Create LLM based on provider"""
        provider = provider.lower()
        
        if provider == "openai":
            if ChatOpenAI is None:
                raise ImportError("langchain-openai not installed")
            return ChatOpenAI(
                model=config.get('model', 'gpt-4o-mini'),
                temperature=config.get('temperature', 0),
                max_tokens=config.get('max_tokens', 1024),
                request_timeout=30
            )
            
        elif provider == "ollama":
            if ChatOllama is None:
                raise ImportError("langchain-ollama not installed")
            return ChatOllama(
                model=config.get('model', 'llama3'),
                temperature=config.get('temperature', 0),
                num_ctx=config.get('max_tokens', 8192)
            )
            
        elif provider == "gemini":
            if GoogleGenerativeAI is None:
                raise ImportError("langchain-google-genai not installed")
            return GoogleGenerativeAI(
                google_api_key=GEMINI_API_KEY,
                model=config.get('model', 'gemini-2.0-flash'),
                temperature=config.get('temperature', 0),
                max_tokens=config.get('max_tokens', 1024)
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    
    # ========================================================================
    # FILE MANAGEMENT - IMPROVED WITH TIMESTAMPED FOLDERS
    # ========================================================================
    
    def create_processed_folder(self, pdf_path: str) -> Path:
        """
        Create timestamped folder for processed files
        Format: filename_YYYYMMDD_HHMMSS
        
        Args:
            pdf_path: Original PDF path
            
        Returns:
            Path to created folder
        """
        pdf_name = Path(pdf_path).stem  # nama tanpa extension
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"{pdf_name}_{timestamp}"
        
        processed_dir = Path(self.config.get('paths', {}).get('processed_dir', 'data/processed'))
        folder_path = processed_dir / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)
        
        print(f"   📁 Created folder: {folder_name}")
        return folder_path
    
    def move_processed_file(self, source_path: str, dest_folder: Path) -> str:
        """
        Move processed file to destination folder
        
        Args:
            source_path: Source file path
            dest_folder: Destination folder path
            
        Returns:
            New file path
        """
        dest_path = dest_folder / Path(source_path).name
        
        try:
            shutil.move(source_path, dest_path)
            print(f"   📦 Moved PDF: {Path(source_path).name}")
            return str(dest_path)
        except Exception as e:
            print(f"   ⚠️ Failed to move {source_path}: {e}")
            return source_path
    
    def move_extracted_images(self, extracted_dir: str, dest_folder: Path) -> List[str]:
        """
        Move extracted images to processed folder
        
        Args:
            extracted_dir: Directory containing extracted images
            dest_folder: Destination folder
            
        Returns:
            List of new file paths
        """
        if not os.path.exists(extracted_dir):
            return []
        
        # Create images subfolder
        images_dest = dest_folder / "images"
        images_dest.mkdir(parents=True, exist_ok=True)
        
        moved_files = []
        extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        
        for f in os.listdir(extracted_dir):
            if any(f.lower().endswith(ext) for ext in extensions):
                src = Path(extracted_dir) / f
                dst = images_dest / f
                try:
                    shutil.move(str(src), str(dst))
                    moved_files.append(str(dst))
                except Exception as e:
                    print(f"   ⚠️ Failed to move image {f}: {e}")
        
        if moved_files:
            print(f"   📦 Moved {len(moved_files)} images")
        
        return moved_files
    
    # ========================================================================
    # DOCUMENT PROCESSING
    # ========================================================================
    
    def process_documents(self, pdf_path: str):
        """
        Process PDF documents for informational mode
        
        Full pipeline:
        1. Parse PDF → Text, Tables, Images
        2. Summarize content (configurable per type)
        3. Chunk
        4. Embed & Store
        5. Move to timestamped folder
        """
        print("\n" + "="*80)
        print("🚀 PROCESSING DOCUMENTS FOR INFORMATIONAL MODE")
        print("="*80)
        print(f"   📄 File: {pdf_path}")
        print(f"   📝 Summarize Text: {self.summarize_text}")
        print(f"   📊 Summarize Tables: {self.summarize_tables}")
        print(f"   🖼️ Summarize Images: {self.summarize_images}")
        print("="*80)
        
        if not os.path.exists(pdf_path):
            print(f"✗ Error: File not found: {pdf_path}")
            return
        
        # Get paths
        extracted_dir = self.config.get('paths', {}).get('extracted_dir', 'data/extracted_data')
        
        # Create timestamped folder
        dest_folder = self.create_processed_folder(pdf_path)
        
        # STEP 1: Parse PDF
        print("\n📖 STEP 1: Parsing PDF...")
        elements, parse_time = self.pdf_parser.parse_pdf(pdf_path)
        print(f"   ⏱️ Parsing time: {parse_time:.2f}s")
        
        # STEP 2: Categorize elements
        print("\n📂 STEP 2: Kategorisasi Elemen...")
        ocr_method = self.config.get('ocr', {}).get('method', 'unstructured')
        
        if ocr_method == 'unstructured':
            parsed = self.pdf_parser.categorize_elements(elements)
            texts = parsed['texts']
            tables = parsed['tables']
        else:
            texts = elements if isinstance(elements, list) else [elements]
            tables = []
        
        print(f"   📝 Texts: {len(texts)}")
        print(f"   📊 Tables: {len(tables)}")
        
        # STEP 3: Summarize Content
        print("\n🔍 STEP 3: Summarizing Content...")
        
        image_summaries = []
        img_base64_list = []
        text_summaries = texts
        table_summaries = tables
        
        if self.content_summarizer:
            result = self.content_summarizer.process_all_content(
                texts=texts,
                tables=tables,
                image_dir=extracted_dir
            )
            
            text_summaries = result['text_summaries'] if result['text_summaries'] else texts
            table_summaries = result['table_summaries'] if result['table_summaries'] else tables
            image_summaries = result['image_summaries']
            img_base64_list = result['base64_images']
        else:
            print("   ⚠️ ContentSummarizer not available")
        
        # STEP 4: Combine and Chunk
        print("\n✂️ STEP 4: Chunking...")
        
        all_summaries = []
        all_summaries.extend(text_summaries)
        all_summaries.extend(table_summaries)
        all_summaries.extend(image_summaries)
        
        all_summaries = [s for s in all_summaries if s and s.strip()]
        
        if not all_summaries:
            print("   ⚠️ Warning: No content to process")
            return
        
        chunks = self.chunker.chunk_texts(all_summaries, self.embeddings)
        stats = self.chunker.get_chunk_statistics(chunks)
        print(f"   📊 Chunk statistics: {stats}")
        
        # STEP 5: Create Retriever and Store
        print("\n🔎 STEP 5: Creating Retriever & Storing...")
        
        retrieval_config = self.config.get('retrieval', {})
        method = RetrievalMethod(retrieval_config.get('method', 'hybrid'))
        
        source_file = Path(pdf_path).name
        
        contents = chunks.copy()
        if img_base64_list:
            contents.extend(img_base64_list)
            chunks.extend(image_summaries)
        
        if method == RetrievalMethod.DENSE:
            self.retriever = self.retriever_builder.create_dense_retriever(
                summaries=chunks,
                contents=contents,
                top_k=retrieval_config.get('top_k', 5),
                source_file=source_file
            )
        elif method == RetrievalMethod.HYBRID:
            hybrid_config = retrieval_config.get('hybrid', {})
            self.retriever = self.retriever_builder.create_hybrid_retriever(
                summaries=chunks,
                contents=contents,
                top_k=retrieval_config.get('top_k', 5),
                dense_weight=hybrid_config.get('dense_weight', 0.7),
                bm25_weight=hybrid_config.get('bm25_weight', 0.3),
                source_file=source_file
            )
        elif method == RetrievalMethod.BM25:
            self.retriever = self.retriever_builder.create_bm25_retriever(
                contents=chunks,
                top_k=retrieval_config.get('top_k', 5)
            )
        
        # STEP 6: Move to Timestamped Folder
        print("\n📦 STEP 6: Moving to Timestamped Folder...")
        
        # Move PDF
        new_pdf_path = self.move_processed_file(pdf_path, dest_folder)
        
        # Move extracted images
        moved_images = self.move_extracted_images(extracted_dir, dest_folder)
        
        # Track processed document
        self.processed_documents.append({
            'name': source_file,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'folder': str(dest_folder),
            'chunks': len(chunks),
            'images': len(image_summaries)
        })
        
        # Summary
        print("\n" + "="*80)
        print("✅ DOCUMENT PROCESSING COMPLETED!")
        print("="*80)
        print(f"   📄 Source: {source_file}")
        print(f"   📁 Folder: {dest_folder.name}")
        print(f"   📝 Text chunks: {len(texts)}")
        print(f"   📊 Table chunks: {len(tables)}")
        print(f"   🖼️ Image summaries: {len(image_summaries)}")
        print(f"   📦 Total chunks stored: {len(chunks)}")
        print("="*80)
    
    def get_processed_documents_info(self) -> List[Dict]:
        """Get information about all processed documents"""
        return self.processed_documents
    
    # ========================================================================
    # QUERY METHODS
    # ========================================================================
    def query_informational(self, question: str) -> str:
        """Handle informational queries with debug prints"""
        
        print(f"\n[DEBUG] Question: {question}")
        
        if not self.retriever:
            print("[DEBUG] Retriever is None!")
            return "Error: Please process documents first using process_documents()"
        
        docs = self.retriever.invoke(question)
        print(f"[DEBUG] Retrieved {len(docs)} documents")
        for i, doc in enumerate(docs[:5]):  # print max 5 docs
            print(f"  Doc {i+1} content:\n{doc.page_content}\n---")
        
        context = "\n\n".join([doc.page_content for doc in docs[:3]])
        print(f"[DEBUG] Context sent to LLM:\n{context}\n---")
        
        prompt_template = self.prompts.get('informational', {}).get('query_prompt', 
            """Pertanyaan: {question}
            
            Konteks: {context}
            
            Jawaban:""")
        
        print(f"[DEBUG] Prompt template before formatting:\n{prompt_template}\n---")
        
        prompt = ChatPromptTemplate.from_template(prompt_template)
        
        chain = prompt | self.llm | StrOutputParser()
        
        answer = chain.invoke({
            "question": question,
            "context": context
        })
        
        print(f"[DEBUG] Answer from LLM:\n{answer}\n---")
        
        return answer

    # def query_informational(self, question: str) -> str:
    #     """Handle informational queries"""
    #     if not self.retriever:
    #         return "Error: Please process documents first using process_documents()"
        
    #     docs = self.retriever.invoke(question)
    #     context = "\n\n".join([doc.page_content for doc in docs[:3]])
        
    #     prompt_template = self.prompts.get('informational', {}).get('query_prompt', 
    #         """Pertanyaan: {question}
            
    #         Konteks: {context}
            
    #         Jawaban:""")
        
    #     prompt = ChatPromptTemplate.from_template(prompt_template)
        
    #     chain = prompt | self.llm | StrOutputParser()
    #     answer = chain.invoke({
    #         "question": question,
    #         "context": context
    #     })
        
    #     return answer
    
    def query_transactional(
        self,
        message: str,
        session_id: Optional[str] = None,
        user_id: str = "default_user"
    ) -> dict:
        """Handle transactional conversation"""
        if self.flow_manager is None:
            self.flow_manager = TransactionalFlowManager(self.config)
        
        if session_id is None:
            session_id = self.flow_manager.create_session(user_id)
            prompt = self.prompts.get('transactional', {}).get('welcome_prompt', 
                "Selamat datang di Sistem Pendaftaran Siswa Baru!")
            return {
                "message": prompt,
                "session_id": session_id,
                "next_step": "data_pribadi"
            }
        
        current_step = self.flow_manager.get_current_step(session_id)
        
        if current_step == "completed":
            return {
                "message": "Pendaftaran Anda sudah selesai!",
                "session_id": session_id,
                "status": "completed"
            }
        
        step_prompts = self.prompts.get('transactional', {}).get('step_prompts', {})
        step_prompt = step_prompts.get(current_step, "Silakan lanjutkan...")
        
        self.flow_manager.save_step_data(session_id, {"input": message})
        progress = self.flow_manager.get_progress(session_id)
        
        return {
            "message": step_prompt,
            "session_id": session_id,
            "progress": progress
        }
    
    def query(
        self,
        message: str,
        session_id: Optional[str] = None,
        user_id: str = "default_user"
    ) -> str:
        """Main query handler"""
        if self.mode == "informational":
            return self.query_informational(message)
        elif self.mode == "transactional":
            return self.query_transactional(message, session_id, user_id)
        else:
            return "Error: Invalid mode"


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution"""
    
    print("\n" + "="*80)
    print("🤖 YPI Al-Azhar RAG Chatbot - Initialization")
    print("="*80)
    
    SUMMARIZE_TEXT = True
    SUMMARIZE_TABLES = True
    SUMMARIZE_IMAGES = False
    
    print(f"\n💰 Cost Configuration:")
    print(f"   - Summarize Text: {SUMMARIZE_TEXT}")
    print(f"   - Summarize Tables: {SUMMARIZE_TABLES}")
    print(f"   - Summarize Images: {SUMMARIZE_IMAGES}")
    
    print("\n🤖 Initializing Dual-Mode RAG Chatbot...")
    
    try:
        chatbot = DualModeRAGChatbot(
            summarize_text=SUMMARIZE_TEXT,
            summarize_tables=SUMMARIZE_TABLES,
            summarize_images=SUMMARIZE_IMAGES
        )
        print("✅ Chatbot initialized successfully!\n")
    except Exception as e:
        print(f"✗ Error initializing chatbot: {e}")
        import traceback
        traceback.print_exc()
        return
    
    pdf_folder = PROJECT_ROOT / "data" / "pdfs"
    pdf_files = list(pdf_folder.glob("*.pdf")) if pdf_folder.exists() else []
    
    if pdf_files:
        print(f"📄 Found {len(pdf_files)} PDF(s) in data/pdfs/:")
        for pdf in pdf_files:
            print(f"   - {pdf.name}")
        
        for pdf_path in pdf_files:
            chatbot.process_documents(str(pdf_path))
        
        questions = [
            "Apa isi dokumen ini?",
            "Jelaskan informasi penting dalam dokumen",
        ]
        
        print("\n" + "="*80)
        print("💬 TESTING INFORMATIONAL MODE")
        print("="*80)
        
        for q in questions:
            print(f"\n❓ Question: {q}")
            try:
                answer = chatbot.query(q)
                print(f"💡 Answer: {answer}\n")
            except Exception as e:
                print(f"✗ Error: {e}\n")
    else:
        print("\n⚠️  No PDF found in data/pdfs/")
        print("   Please add PDF files to test")
    
    print("\n" + "="*80)
    print("✅ Testing completed!")
    print("="*80)


if __name__ == "__main__":
    main()