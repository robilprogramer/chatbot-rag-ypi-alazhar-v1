
# ============================================================================
# FILE: utils/smart_retriever.py
# ============================================================================
"""
Smart Retriever dengan Context-Aware Filtering
Automatic filter extraction dari query
"""

from typing import List, Dict, Optional
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever


class SmartRetriever:
    """
    Smart Retriever yang bisa filter based on metadata
    
    Features:
    - Auto-extract filter dari query
    - Metadata-based filtering (jenjang, cabang, tahun)
    - Hybrid retrieval (dense + BM25)
    - Fallback mechanism
    """
    
    def __init__(
        self,
        vectorstore: Chroma,
        query_parser,
        top_k: int = 5,
        use_hybrid: bool = True,
        dense_weight: float = 0.7,
        bm25_weight: float = 0.3
    ):
        self.vectorstore = vectorstore
        self.query_parser = query_parser
        self.top_k = top_k
        self.use_hybrid = use_hybrid
        self.dense_weight = dense_weight
        self.bm25_weight = bm25_weight
    
    def retrieve(
        self,
        query: str,
        filters: Optional[Dict] = None,
        top_k: Optional[int] = None
    ) -> List[Document]:
        """
        Main retrieval method dengan auto-filtering
        
        Args:
            query: User query
            filters: Manual filters (optional, will override auto-extraction)
            top_k: Override default top_k
            
        Returns:
            List of relevant documents
        """
        if top_k is None:
            top_k = self.top_k
        
        # Auto-extract filters dari query jika tidak ada manual filter
        if filters is None:
            parsed = self.query_parser.parse_query(query)
            filters = self._create_filter_dict(parsed)
        
        print(f"\n🔍 Smart Retrieval:")
        print(f"   Query: {query}")
        if filters:
            print(f"   Filters: {filters}")
        
        # Try dengan filter dulu
        if filters:
            docs = self._retrieve_with_filter(query, filters, top_k)
            
            # Jika hasil <2, coba tanpa filter
            if len(docs) < 2:
                print(f"   ⚠️ Only {len(docs)} results with filter, trying without...")
                docs_no_filter = self._retrieve_no_filter(query, top_k)
                
                # Combine results (filter results first, then no-filter)
                seen_ids = {id(doc) for doc in docs}
                for doc in docs_no_filter:
                    if id(doc) not in seen_ids:
                        docs.append(doc)
                        if len(docs) >= top_k:
                            break
        else:
            # No filter, langsung retrieve
            docs = self._retrieve_no_filter(query, top_k)
        
        print(f"   ✅ Retrieved {len(docs)} documents")
        
        # Print metadata dari hasil
        if docs:
            print(f"   📊 Results metadata:")
            for i, doc in enumerate(docs[:3]):
                meta = doc.metadata
                print(f"      {i+1}. {meta.get('jenjang', '?')} - "
                      f"{meta.get('cabang', '?')} - "
                      f"{meta.get('tahun', '?')}")
        
        return docs
    
    def _create_filter_dict(self, parsed: Dict) -> Optional[Dict]:
        """Create Chroma filter dict dari parsed query"""
        filter_dict = {}
        
        # Only add non-None values
        if parsed.get('jenjang'):
            filter_dict['jenjang'] = parsed['jenjang']
        
        if parsed.get('cabang'):
            filter_dict['cabang'] = parsed['cabang']
        
        if parsed.get('tahun'):
            filter_dict['tahun'] = parsed['tahun']
        
        if parsed.get('kategori'):
            filter_dict['kategori'] = parsed['kategori']
        
        return filter_dict if filter_dict else None
    
    def _retrieve_with_filter(
        self,
        query: str,
        filters: Dict,
        top_k: int
    ) -> List[Document]:
        """Retrieve dengan metadata filtering"""
        try:
            # Convert our filter to Chroma's where format
            # Convert our filter to Chroma's where format
            conditions = [{k: {"$eq": v}} for k, v in filters.items()]

            if len(conditions) == 1:
                # Only one filter → don't use $and
                where_clause = conditions[0]
            else:
                # Multiple filters → must use $and
                where_clause = {"$and": conditions}


            
            docs = self.vectorstore.similarity_search(
                query,
                k=top_k * 2,  # Get more, then we'll filter
                filter=where_clause
            )
            
            return docs[:top_k]
            
        except Exception as e:
            print(f"   ⚠️ Filter retrieval error: {e}")
            return []
    
    def _retrieve_no_filter(
        self,
        query: str,
        top_k: int
    ) -> List[Document]:
        """Retrieve tanpa filtering (fallback)"""
        return self.vectorstore.similarity_search(query, k=top_k)
    
    def retrieve_by_metadata(
        self,
        jenjang: Optional[str] = None,
        cabang: Optional[str] = None,
        tahun: Optional[str] = None,
        limit: int = 10
    ) -> List[Document]:
        """
        Retrieve langsung by metadata (tanpa query)
        Useful untuk browsing/exploring
        """
        filter_dict = {}
        
        if jenjang:
            filter_dict['jenjang'] = jenjang
        if cabang:
            filter_dict['cabang'] = cabang
        if tahun:
            filter_dict['tahun'] = tahun
        
        if not filter_dict:
            print("⚠️ No filters provided")
            return []
        
        where_clause = {k: {"$eq": v} for k, v in filter_dict.items()}
        
        results = self.vectorstore._collection.get(
            where=where_clause,
            limit=limit,
            include=["documents", "metadatas"]
        )
        
        if not results or not results.get('documents'):
            return []
        
        docs = []
        for content, metadata in zip(results['documents'], results['metadatas']):
            doc = Document(page_content=content, metadata=metadata)
            docs.append(doc)
        
        return docs
    
    def get_available_metadata(self) -> Dict[str, List[str]]:
        """
        Get unique values untuk setiap metadata field
        Useful untuk UI filtering
        """
        try:
            # Get all documents
            all_data = self.vectorstore._collection.get(
                include=["metadatas"]
            )
            
            if not all_data or not all_data.get('metadatas'):
                return {}
            
            # Collect unique values
            jenjang_set = set()
            cabang_set = set()
            tahun_set = set()
            kategori_set = set()
            
            for meta in all_data['metadatas']:
                if meta:
                    if meta.get('jenjang'):
                        jenjang_set.add(meta['jenjang'])
                    if meta.get('cabang'):
                        cabang_set.add(meta['cabang'])
                    if meta.get('tahun'):
                        tahun_set.add(meta['tahun'])
                    if meta.get('kategori'):
                        kategori_set.add(meta['kategori'])
            
            return {
                'jenjang': sorted(list(jenjang_set)),
                'cabang': sorted(list(cabang_set)),
                'tahun': sorted(list(tahun_set)),
                'kategori': sorted(list(kategori_set))
            }
            
        except Exception as e:
            print(f"Error getting metadata: {e}")
            return {}


# ============================================================================
# ENHANCED QUERY CHAIN - dengan metadata-aware prompt
# ============================================================================

class EnhancedQueryChain:
    """
    Query chain yang metadata-aware
    """
    
    def __init__(
        self,
        smart_retriever: SmartRetriever,
        llm,
        system_prompt: str,
        query_prompt: str
    ):
        self.retriever = smart_retriever
        self.llm = llm
        self.system_prompt = system_prompt
        self.query_prompt = query_prompt
    
    def query(
        self,
        question: str,
        filters: Optional[Dict] = None
    ) -> Dict[str, any]:
        """
        Execute query dengan metadata context
        
        Returns:
            Dict dengan 'answer', 'sources', 'metadata'
        """
        # Retrieve documents
        docs = self.retriever.retrieve(question, filters)
        
        if not docs:
            return {
                'answer': "Maaf, saya tidak menemukan informasi yang relevan dalam database.",
                'sources': [],
                'metadata': {}
            }
        
        # Build context dengan metadata info
        context_parts = []
        sources = []
        
        for i, doc in enumerate(docs):
            meta = doc.metadata
            
            # Format metadata info
            meta_info = f"[Dokumen {i+1}]"
            if meta.get('jenjang'):
                meta_info += f" Jenjang: {meta['jenjang']}"
            if meta.get('cabang'):
                meta_info += f" | Cabang: {meta['cabang']}"
            if meta.get('tahun'):
                meta_info += f" | Tahun: {meta['tahun']}"
            
            context_parts.append(f"{meta_info}\n{doc.page_content}")
            
            # Track sources
            sources.append({
                'source': meta.get('source', 'Unknown'),
                'jenjang': meta.get('jenjang', 'Unknown'),
                'cabang': meta.get('cabang', 'Unknown'),
                'tahun': meta.get('tahun', 'Unknown')
            })
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Format prompt
        full_prompt = f"""{self.system_prompt}

{       self.query_prompt.format(question=question, context=context)}"""
        
        # Get answer from LLM
        answer = self.llm.invoke(full_prompt).content
        
        return {
            'answer': answer,
            'sources': sources,
            'metadata': {
                'num_sources': len(sources),
                'filters_used': filters
            }
        }

