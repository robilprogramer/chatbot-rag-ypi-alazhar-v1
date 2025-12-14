# ============================================================================
# FILE: app_enhanced.py - Streamlit dengan Metadata-Aware RAG
# ============================================================================
"""
Enhanced Streamlit Chat Interface dengan:
- Metadata filtering (jenjang, cabang, tahun)
- Smart context-aware retrieval
- Source tracking dengan metadata
"""

import streamlit as st
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List

# Add project root
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Page config
st.set_page_config(
    page_title="YPI Al-Azhar Smart Chatbot",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS Styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        color: white;
        border-radius: 10px;
        margin-bottom: 1.5rem;
    }
    
    .user-message {
        background-color: #1e3a5f;
        color: white;
        padding: 1rem;
        border-radius: 15px 15px 5px 15px;
        margin: 0.5rem 0;
        margin-left: 20%;
        border: 1px solid #2d5a87;
    }
    
    .assistant-message {
        background-color: #2d2d2d;
        color: white;
        padding: 1rem;
        border-radius: 15px 15px 15px 5px;
        margin: 0.5rem 0;
        margin-right: 20%;
        border: 1px solid #404040;
    }
    
    .metadata-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        margin: 0.25rem;
        border-radius: 5px;
        font-size: 0.75rem;
        font-weight: bold;
    }
    
    .badge-jenjang { background-color: #2196f3; color: white; }
    .badge-cabang { background-color: #4caf50; color: white; }
    .badge-tahun { background-color: #ff9800; color: white; }
    
    .source-card {
        background-color: #2d2d2d;
        padding: 0.75rem;
        border-radius: 8px;
        margin: 0.5rem 0;
        border-left: 3px solid #2196f3;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SESSION STATE
# ============================================================================
def init_session_state():
    """Initialize session state"""
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = None
    
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    
    if 'retriever' not in st.session_state:
        st.session_state.retriever = None
    
    if 'available_metadata' not in st.session_state:
        st.session_state.available_metadata = {}
    
    if 'active_filters' not in st.session_state:
        st.session_state.active_filters = {
            'jenjang': None,
            'cabang': None,
            'tahun': None
        }
    
    if 'is_initialized' not in st.session_state:
        st.session_state.is_initialized = False

init_session_state()

# ============================================================================
# CHATBOT INITIALIZATION
# ============================================================================
@st.cache_resource
def load_chatbot():
    """Load chatbot dengan smart retriever"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        from utils.metadata_extractor import MetadataExtractor, QueryParser
        from utils.smart_retriever import SmartRetriever, EnhancedQueryChain
        from utils.embeddings import EmbeddingManager, EmbeddingModel
        from langchain_chroma import Chroma
        from langchain_openai import ChatOpenAI
        
        print("\n" + "="*60)
        print("🔄 LOADING SMART CHATBOT")
        print("="*60)
        
        # Components
        parser = QueryParser()
        print("   ✅ Query Parser")
        
        embedding_manager = EmbeddingManager(
            model_type=EmbeddingModel.OPENAI,
            config={'model_name': 'text-embedding-3-small'}
        )
        embeddings = embedding_manager.get_embeddings()
        print("   ✅ Embeddings")
        
        # Vector Store
        vectorstore = Chroma(
            collection_name="test_collection",
            embedding_function=embeddings,
            persist_directory="./test_chroma_db"
        )
        
        count = vectorstore._collection.count()
        print(f"   📊 Documents: {count}")
        
        if count == 0:
            print("   ⚠️ No documents in ChromaDB")
            return None
        
        # Smart Retriever
        smart_retriever = SmartRetriever(
            vectorstore=vectorstore,
            query_parser=parser,
            top_k=5
        )
        print("   ✅ Smart Retriever")
        
        # LLM
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0
        )
        print("   ✅ LLM")
        
        # Prompts
        system_prompt = """
ATURAN UTAMA - WAJIB DIPATUHI:
1. Anda HARUS SELALU menjawab dalam BAHASA INDONESIA
2. JANGAN PERNAH menjawab dalam bahasa Inggris
3. WAJIB sebutkan JENJANG, CABANG, dan TAHUN dari dokumen
4. JANGAN menebak informasi yang TIDAK ada dalam konteks
5. Jika pertanyaan dan konteks TIDAK SESUAI, jawab:
   'Maaf, dokumen yang tersedia tidak mencakup informasi yang ditanyakan.'
"""

        
        query_prompt = """
Pertanyaan: {question}

Konteks dari dokumen:
{context}

ATURAN MENJAWAB:
1. Jawab dalam Bahasa Indonesia
2. WAJIB sebutkan: Jenjang, Cabang, Tahun
3. Format jawaban: "Berdasarkan dokumen [Jenjang] [Cabang] Tahun [Tahun], ..."
4. Jika konteks tidak cukup atau tidak relevan dengan pertanyaan, jawab:
   "Maaf, dokumen yang tersedia tidak mencakup informasi yang ditanyakan."
5. Jangan menebak atau menggunakan dokumen lain yang tidak relevan

Jawaban (dalam Bahasa Indonesia):
"""

        
        # Query Chain
        query_chain = EnhancedQueryChain(
            smart_retriever=smart_retriever,
            llm=llm,
            system_prompt=system_prompt,
            query_prompt=query_prompt
        )
        print("   ✅ Query Chain")
        
        # Get available metadata
        available = smart_retriever.get_available_metadata()
        
        print("="*60)
        print("✅ Chatbot Ready!")
        print("="*60 + "\n")
        
        return {
            'retriever': smart_retriever,
            'query_chain': query_chain,
            'available_metadata': available
        }
        
    except Exception as e:
        print(f"❌ Error loading chatbot: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================================================
# SIDEBAR
# ============================================================================
def render_sidebar():
    """Render sidebar dengan metadata filters"""
    
    with st.sidebar:
        st.markdown("""
        <div style='text-align: center; padding: 1rem;'>
            <h2>🎓 YPI Al-Azhar</h2>
            <p style='color: #666;'>Smart RAG Chatbot</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.divider()
        
        # Metadata Filters
        if st.session_state.available_metadata:
            st.subheader("🔍 Filter Pencarian")
            
            available = st.session_state.available_metadata
            
            # Jenjang filter
            jenjang_options = ['Semua'] + available.get('jenjang', [])
            selected_jenjang = st.selectbox(
                "Jenjang",
                options=jenjang_options,
                key="filter_jenjang"
            )
            st.session_state.active_filters['jenjang'] = None if selected_jenjang == 'Semua' else selected_jenjang
            
            # Cabang filter
            cabang_options = ['Semua'] + available.get('cabang', [])
            selected_cabang = st.selectbox(
                "Cabang",
                options=cabang_options,
                key="filter_cabang"
            )
            st.session_state.active_filters['cabang'] = None if selected_cabang == 'Semua' else selected_cabang
            
            # Tahun filter
            tahun_options = ['Semua'] + available.get('tahun', [])
            selected_tahun = st.selectbox(
                "Tahun Ajaran",
                options=tahun_options,
                key="filter_tahun"
            )
            st.session_state.active_filters['tahun'] = None if selected_tahun == 'Semua' else selected_tahun
            
            # Show active filters
            active = [f for f in st.session_state.active_filters.values() if f]
            if active:
                st.info(f"🎯 Filter Aktif: {', '.join(active)}")
            
            if st.button("🗑️ Reset Filter", use_container_width=True):
                st.session_state.active_filters = {
                    'jenjang': None,
                    'cabang': None,
                    'tahun': None
                }
                st.rerun()
        
        st.divider()
        
        # Statistics
        st.subheader("📊 Statistik")
        
        if st.session_state.chatbot:
            retriever = st.session_state.chatbot['retriever']
            vectorstore = retriever.vectorstore
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("📄 Dokumen", vectorstore._collection.count())
            with col2:
                st.metric("💬 Chat", len(st.session_state.chat_history))
            
            # Show metadata distribution
            if st.session_state.available_metadata:
                with st.expander("📈 Distribusi Data"):
                    meta = st.session_state.available_metadata
                    
                    if meta.get('jenjang'):
                        st.write("**Jenjang:**")
                        for j in meta['jenjang']:
                            st.write(f"• {j}")
                    
                    if meta.get('cabang'):
                        st.write("**Cabang:**")
                        for c in meta['cabang'][:5]:
                            st.write(f"• {c}")
        
        st.divider()
        
        # Actions
        st.subheader("⚙️ Aksi")
        
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.chat_history = []
            st.rerun()

# ============================================================================
# MAIN CHAT
# ============================================================================
def render_chat():
    """Render main chat interface"""
    
    # Header
    st.markdown("""
    <div class='main-header'>
        <h1>🎓 YPI Al-Azhar Smart Chatbot</h1>
        <p>Chatbot berbasis RAG dengan Context-Aware Retrieval</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if chatbot loaded
    if st.session_state.chatbot is None:
        st.error("❌ Chatbot gagal dimuat")
        st.info("""
        **Troubleshooting:**
        1. Pastikan ChromaDB sudah berisi dokumen
        2. Jalankan `test_full_pipeline.py` untuk setup
        3. Cek environment variables (OPENAI_API_KEY)
        """)
        
        if st.button("🔄 Coba Load Ulang"):
            st.cache_resource.clear()
            st.rerun()
        return
    
    # Display chat history
    for msg in st.session_state.chat_history:
        if msg['role'] == 'user':
            st.markdown(f"""
            <div class='user-message'>
                <strong>👤 Anda:</strong><br>
                {msg['content']}
            </div>
            """, unsafe_allow_html=True)
        else:
            # Assistant message dengan sources
            st.markdown(f"""
            <div class='assistant-message'>
                <strong>🤖 Asisten:</strong><br>
                {msg['content']}
            </div>
            """, unsafe_allow_html=True)
            
            # Show sources if available
            if 'sources' in msg and msg['sources']:
                with st.expander(f"📚 Sumber ({len(msg['sources'])} dokumen)"):
                    for i, src in enumerate(msg['sources'], 1):
                        st.markdown(f"""
                        <div class='source-card'>
                            <strong>{i}. {src.get('source', 'Unknown')}</strong><br>
                            <span class='metadata-badge badge-jenjang'>{src.get('jenjang', '?')}</span>
                            <span class='metadata-badge badge-cabang'>{src.get('cabang', '?')}</span>
                            <span class='metadata-badge badge-tahun'>{src.get('tahun', '?')}</span>
                        </div>
                        """, unsafe_allow_html=True)
    
    # Chat input
    st.divider()
    
    user_input = st.chat_input("Ketik pertanyaan Anda... (contoh: Berapa biaya TK di Cibinong?)")
    
    if user_input:
        # Add user message
        st.session_state.chat_history.append({
            'role': 'user',
            'content': user_input
        })
        
        # Get response
        with st.spinner("🔍 Mencari jawaban..."):
            try:
                query_chain = st.session_state.chatbot['query_chain']
                
                # Build filters
                filters = {}
                if st.session_state.active_filters['jenjang']:
                    filters['jenjang'] = st.session_state.active_filters['jenjang']
                if st.session_state.active_filters['cabang']:
                    filters['cabang'] = st.session_state.active_filters['cabang']
                if st.session_state.active_filters['tahun']:
                    filters['tahun'] = st.session_state.active_filters['tahun']
                
                # Query
                result = query_chain.query(
                    user_input,
                    filters=filters if filters else None
                )
                
                # Add assistant response
                st.session_state.chat_history.append({
                    'role': 'assistant',
                    'content': result['answer'],
                    'sources': result.get('sources', [])
                })
                
            except Exception as e:
                error_msg = f"❌ Maaf, terjadi kesalahan: {str(e)}"
                st.session_state.chat_history.append({
                    'role': 'assistant',
                    'content': error_msg
                })
                print(f"Query error: {e}")
                import traceback
                traceback.print_exc()
        
        st.rerun()

# ============================================================================
# MAIN APP
# ============================================================================
def main():
    """Main app"""
    
    # Render sidebar
    render_sidebar()
    
    # Initialize chatbot (only once)
    if not st.session_state.is_initialized:
        with st.spinner("🔄 Loading Smart Chatbot..."):
            chatbot_data = load_chatbot()
            
            if chatbot_data:
                st.session_state.chatbot = chatbot_data
                st.session_state.available_metadata = chatbot_data['available_metadata']
                st.session_state.is_initialized = True
            else:
                st.session_state.is_initialized = False
    
    # Render main chat
    render_chat()
    
    # Footer
    st.divider()
    st.markdown("""
    <div style='text-align: center; color: #666; font-size: 0.8rem;'>
        <p>🎓 YPI Al-Azhar Smart RAG Chatbot © 2025</p>
        <p>Powered by Metadata-Aware Retrieval</p>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()