# routes/chat_enhanced.py

"""
Enhanced Chat API Router
Supports conversation history and improved RAG
WITH CONVERSATION MEMORY INTEGRATION
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from core.rag_factory_enhanced import (
    get_query_chain,
    get_conversation_manager,
    clear_conversation,
    query_rag_with_context,  # NEW: Use context-aware function
    query_rag
)

# NEW: Import conversation memory for stats
from core.conversation_memory import get_conversation_memory

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# =========================
# Request/Response Models
# =========================

class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    question: str = Field(..., description="User question")
    session_id: Optional[str] = Field("default", description="Session ID for conversation tracking")
    metadata_filter: Optional[Dict[str, str]] = Field(None, description="Metadata filters (jenjang, cabang, tahun, kategori)")
    include_history: bool = Field(True, description="Include conversation history in context")


class SourceDocument(BaseModel):
    """Source document information"""
    source: str
    jenjang: str
    cabang: str
    tahun: str
    kategori: str
    content_preview: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    answer: str
    sources: List[SourceDocument]
    metadata: Dict[str, Any]
    session_id: str
    has_context: bool = False  # NEW: Indicates if conversation context was used


class ConversationHistoryResponse(BaseModel):
    """Response for conversation history"""
    session_id: str
    messages: List[ChatMessage]
    message_count: int


# =========================
# Main Endpoints
# =========================


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main chat endpoint with RAG and Conversation Memory
    
    Features:
    - Automatic conversation context injection
    - Entity extraction
    - Metadata filtering
    - Source attribution
    """
    try:
        print(f"\n{'='*60}")
        print(f"📨 Chat Request")
        print(f"   Question: {req.question}")
        print(f"   Session: {req.session_id}")
        print(f"   Filters: {req.metadata_filter}")
        print(f"   Include History: {req.include_history}")
        print(f"{'='*60}")
        
        # Use context-aware query if history is enabled
        if req.include_history:
            print("   🔍 Using conversation context...")
            result = query_rag_with_context(
                question=req.question,
                session_id=req.session_id,
                filters=req.metadata_filter
            )
            print("   ✅ Used conversation-aware query")
        else:
            # Direct query without context
            result = query_rag(
                question=req.question,
                session_id=req.session_id,
                filters=req.metadata_filter
            )
            result['has_context'] = False
            print("   ✅ Used direct query (no context)")
        
        # Format sources
        sources = [
            SourceDocument(**src) for src in result['sources']
        ]
        
        return ChatResponse(
            answer=result['answer'],
            sources=sources,
            metadata=result['metadata'],
            session_id=req.session_id,
            has_context=result.get('has_context', False)
        )

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simple")
async def simple_chat(
    question: str = Query(..., description="User question"),
    session_id: str = Query("default", description="Session ID"),
    jenjang: Optional[str] = Query(None, description="Filter by jenjang"),
    cabang: Optional[str] = Query(None, description="Filter by cabang"),
    tahun: Optional[str] = Query(None, description="Filter by tahun"),
    include_history: bool = Query(True, description="Include conversation context")
):
    """
    Simplified chat endpoint (query parameters instead of JSON body)
    Useful for quick testing with conversation context
    """
    try:
        # Build filters
        filters = {}
        if jenjang:
            filters['jenjang'] = jenjang
        if cabang:
            filters['cabang'] = cabang
        if tahun:
            filters['tahun'] = tahun
        
        # Use context-aware function
        if include_history:
            result = query_rag_with_context(
                question=question,
                session_id=session_id,
                filters=filters if filters else None
            )
        else:
            result = query_rag(
                question=question,
                session_id=session_id,
                filters=filters if filters else None
            )
            result['has_context'] = False
        
        return {
            "answer": result['answer'],
            "sources": result['sources'],
            "metadata": result['metadata'],
            "has_context": result.get('has_context', False)
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Conversation Management Endpoints
# =========================

@router.get("/history/{session_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(session_id: str):
    """
    Get conversation history for a session
    Returns messages from conversation_memory system
    """
    try:
        memory = get_conversation_memory()
        messages_list = memory.get_history(session_id)
        
        # Convert to ChatMessage format
        messages = [
            ChatMessage(
                role=msg.role,
                content=msg.content
            ) 
            for msg in messages_list
        ]
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            message_count=len(messages)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{session_id}")
async def delete_conversation_history(session_id: str):
    """
    Clear conversation history for a session
    Clears both new memory system and legacy ConversationManager
    """
    try:
        clear_conversation(session_id)
        
        return {
            "success": True,
            "message": f"Conversation history cleared for session: {session_id}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_memory_stats():
    """
    Get conversation memory statistics
    Shows total sessions, messages, and configuration
    """
    try:
        memory = get_conversation_memory()
        stats = memory.get_stats()
        
        return {
            "success": True,
            "stats": stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Utility Endpoints
# =========================

@router.get("/metadata")
async def get_available_metadata():
    """
    Get available metadata values for filtering
    Useful for building UI filters
    """
    try:
        query_chain = get_query_chain()
        retriever = query_chain.retriever
        
        metadata = retriever.get_available_metadata()
        
        return {
            "success": True,
            "metadata": metadata
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    Checks RAG system and conversation memory
    """
    try:
        query_chain = get_query_chain()
        memory = get_conversation_memory()
        stats = memory.get_stats()
        
        return {
            "status": "healthy",
            "rag_initialized": query_chain is not None,
            "conversation_memory": {
                "active_sessions": stats['total_sessions'],
                "total_messages": stats['total_messages']
            },
            "message": "RAG system and conversation memory are ready"
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# =========================
# Testing Endpoint
# =========================

@router.post("/test-context")
async def test_conversation_context():
    """
    Test endpoint to verify conversation context is working
    Runs a multi-turn conversation and returns results
    """
    try:
        test_session = f"test-{int(__import__('time').time())}"
        
        results = []
        
        # Question 1
        result1 = query_rag_with_context(
            "Berapa biaya SD?",
            session_id=test_session
        )
        results.append({
            "question": "Berapa biaya SD?",
            "answer": result1['answer'][:200] + "...",
            "has_context": result1['has_context']
        })
        
        # Question 2 (should use context)
        result2 = query_rag_with_context(
            "Kalau SMP?",
            session_id=test_session
        )
        results.append({
            "question": "Kalau SMP?",
            "answer": result2['answer'][:200] + "...",
            "has_context": result2['has_context']
        })
        
        # Question 3 (should use context)
        result3 = query_rag_with_context(
            "Ada beasiswa?",
            session_id=test_session
        )
        results.append({
            "question": "Ada beasiswa?",
            "answer": result3['answer'][:200] + "...",
            "has_context": result3['has_context']
        })
        
        # Clean up
        clear_conversation(test_session)
        
        return {
            "success": True,
            "test_session": test_session,
            "results": results,
            "message": "Context test completed. Check has_context field - should be True for questions 2 and 3."
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))