"""
FastAPI Backend Service untuk Transactional Chatbot - IMPROVED VERSION
FOKUS: Pure transactional dengan context awareness yang lebih baik
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import json

from conversation_state_v2 import StateManager, ConversationState, RegistrationStep
from conversational_form_handler_v2 import ConversationalFormHandler
from intent_classifier_v2 import IntentClassifier
from database import DatabaseManager
from config import settings


app = FastAPI(
    title="YPI Al-Azhar Transactional Chatbot API - V2",
    description="API untuk chatbot pendaftaran siswa baru dengan LLM - Context Aware Version",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
from llm_client import get_llm_client

state_manager = StateManager()
llm_client = get_llm_client()
form_handler = ConversationalFormHandler(llm_client, state_manager)
intent_classifier = IntentClassifier(llm_client)

# Database manager
db_manager = DatabaseManager(settings.DATABASE_URL)


# Request/Response Models
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    
class ChatResponse(BaseModel):
    session_id: str
    response: str
    current_step: str
    completion_percentage: float
    is_transactional: bool
    metadata: Dict[str, Any] = {}


class SessionInfo(BaseModel):
    session_id: str
    current_step: str
    completion_percentage: float
    is_transactional: bool
    created_at: str
    updated_at: str
    student_data: Dict[str, Any]
    parent_data: Dict[str, Any]
    academic_data: Dict[str, Any]
    conversation_summary: List[Dict[str, str]]


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    document_type: str
    file_path: Optional[str] = None


class RegistrationSummary(BaseModel):
    registration_number: Optional[str] = None
    student_name: str
    school_name: str
    tingkatan: str
    program: str
    status: str
    completion_percentage: float
    estimated_cost: Optional[float] = None


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "YPI Al-Azhar Transactional Chatbot V2",
        "status": "active",
        "version": "2.0.0",
        "features": [
            "Context-aware conversations",
            "History tracking",
            "Natural language extraction",
            "Multi-step registration"
        ]
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - IMPROVED VERSION
    
    FLOW:
    1. Get or create session (always transactional)
    2. Process message with full context awareness
    3. Return response dengan metadata
    """
    
    # Generate atau gunakan existing session_id
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get or create session
    state = state_manager.get_session(session_id)
    if not state:
        state = state_manager.create_session(session_id)
    
    # SIMPLIFIED: Semua percakapan adalah transactional
    # Hanya classify untuk logging purposes
    intent = "transactional"  # ALWAYS transactional
    
    try:
        # Process dengan conversational form handler
        response, updated_state = await form_handler.process_message(
            session_id, 
            request.message
        )
        
        # Save conversation to database
        db_manager.save_conversation(
            session_id=session_id,
            user_message=request.message,
            bot_response=response,
            intent="transactional"
        )
        
        # Save conversation state
        db_manager.save_conversation_state(
            session_id=session_id,
            current_step=updated_state.current_step,
            collected_data=updated_state.to_dict()
        )
        
        return ChatResponse(
            session_id=session_id,
            response=response,
            current_step=updated_state.current_step,
            completion_percentage=updated_state.get_completion_percentage(),
            is_transactional=True,
            metadata={
                "intent": "transactional",
                "missing_fields": updated_state.get_missing_fields(),
                "is_step_complete": updated_state.is_step_complete(),
                "messages_count": len(updated_state.conversation_history)
            }
        )
    
    except Exception as e:
        print(f"Error processing message: {e}")
        import traceback
        traceback.print_exc()
        
        return ChatResponse(
            session_id=session_id,
            response="Maaf, terjadi kesalahan. Silakan coba lagi.",
            current_step=state.current_step if state else "greeting",
            completion_percentage=0.0,
            is_transactional=True,
            metadata={"error": str(e)}
        )


@app.post("/api/session/new")
async def create_new_session():
    """Create new registration session"""
    session_id = str(uuid.uuid4())
    state = state_manager.create_session(session_id)
    
    return {
        "session_id": session_id,
        "message": "Session baru telah dibuat. Silakan mulai percakapan.",
        "current_step": state.current_step,
        "is_transactional": True
    }


@app.get("/api/session/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """Get session information dengan conversation history"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    return SessionInfo(
        session_id=state.session_id,
        current_step=state.current_step,
        completion_percentage=state.get_completion_percentage(),
        is_transactional=state.is_transactional,
        created_at=state.created_at.isoformat(),
        updated_at=state.updated_at.isoformat(),
        student_data=state.student_data.dict(),
        parent_data=state.parent_data.dict(),
        academic_data=state.academic_data.dict(),
        conversation_summary=state.get_last_messages(10)
    )


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete session"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    state_manager.delete_session(session_id)
    
    return {"message": "Session berhasil dihapus"}


@app.post("/api/upload/document", response_model=DocumentUploadResponse)
async def upload_document(
    session_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload dokumen persyaratan"""
    
    from file_storage import get_file_storage
    
    # Validasi session
    state = state_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    # Validasi document type
    valid_types = [
        "akta_kelahiran", "kartu_keluarga", "foto_siswa",
        "ijazah_terakhir", "rapor_terakhir", "surat_keterangan_sehat"
    ]
    
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail="Tipe dokumen tidak valid")
    
    # Read file content
    file_content = await file.read()
    
    # Get file storage handler
    storage = get_file_storage()
    
    # Validate file
    is_valid, error_msg = storage.validate_file(file.filename, len(file_content))
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Save file
    try:
        file_path = storage.save_file(
            file_content=file_content,
            original_filename=file.filename,
            session_id=session_id,
            document_type=document_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")
    
    # Update state
    setattr(state.documents, document_type, file_path)
    state_manager.update_session(session_id, state)
    
    return DocumentUploadResponse(
        success=True,
        message=f"Dokumen {document_type} berhasil diupload",
        document_type=document_type,
        file_path=file_path
    )


@app.get("/api/registration/summary/{session_id}", response_model=RegistrationSummary)
async def get_registration_summary(session_id: str):
    """Get registration summary"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    # Calculate estimated cost berdasarkan tingkatan
    # Mapping sederhana, bisa disesuaikan
    cost_mapping = {
        "Playgroup": 8000000,
        "TK A": 8500000,
        "TK B": 8500000,
        "Kelas 1": 12000000,
        "Kelas 2": 12000000,
        "Kelas 3": 12000000,
        "Kelas 4": 12000000,
        "Kelas 5": 12000000,
        "Kelas 6": 12000000,
        "Kelas 7": 15000000,
        "Kelas 8": 15000000,
        "Kelas 9": 15000000,
        "Kelas 10": 18000000,
        "Kelas 11": 18000000,
        "Kelas 12": 18000000,
    }
    
    estimated_cost = cost_mapping.get(state.student_data.tingkatan, None)
    
    return RegistrationSummary(
        registration_number=None,
        student_name=state.student_data.nama_lengkap or "Belum diisi",
        school_name=state.student_data.nama_sekolah or "Belum dipilih",
        tingkatan=state.student_data.tingkatan or "Belum dipilih",
        program=state.student_data.program or "Belum dipilih",
        status=state.current_step,
        completion_percentage=state.get_completion_percentage(),
        estimated_cost=estimated_cost
    )


@app.post("/api/registration/confirm/{session_id}")
async def confirm_registration(session_id: str):
    """Confirm and finalize registration"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    # Validate completeness
    if state.get_completion_percentage() < 60:  # Minimal 60% complete
        raise HTTPException(
            status_code=400, 
            detail="Data pendaftaran belum cukup lengkap. Minimal 60% harus terisi."
        )
    
    # Generate registration number
    year = datetime.now().year
    
    # Extract tingkatan untuk code
    tingkatan_code = "XX"
    if state.student_data.tingkatan:
        if "Playgroup" in state.student_data.tingkatan or "TK" in state.student_data.tingkatan:
            tingkatan_code = "TK"
        elif "Kelas 1" in state.student_data.tingkatan or "Kelas 2" in state.student_data.tingkatan or \
             "Kelas 3" in state.student_data.tingkatan or "Kelas 4" in state.student_data.tingkatan or \
             "Kelas 5" in state.student_data.tingkatan or "Kelas 6" in state.student_data.tingkatan:
            tingkatan_code = "SD"
        elif "Kelas 7" in state.student_data.tingkatan or "Kelas 8" in state.student_data.tingkatan or \
             "Kelas 9" in state.student_data.tingkatan:
            tingkatan_code = "MP"
        elif "Kelas 10" in state.student_data.tingkatan or "Kelas 11" in state.student_data.tingkatan or \
             "Kelas 12" in state.student_data.tingkatan:
            tingkatan_code = "MA"
    
    random_suffix = str(uuid.uuid4())[:8].upper()
    registration_number = f"AZHAR-{year}-{tingkatan_code}-{random_suffix}"
    
    # Save to database
    try:
        registration_id = db_manager.save_registration(
            registration_number=registration_number,
            student_data=state.student_data.dict(),
            parent_data=state.parent_data.dict(),
            academic_data=state.academic_data.dict(),
            status="submitted"
        )
        
        # Save documents
        for doc_type, file_path in state.documents.dict().items():
            if file_path:
                db_manager.add_registration_document(
                    registration_id=registration_id,
                    document_type=doc_type,
                    filename=file_path.split('/')[-1],
                    file_path=file_path
                )
        
        # Add tracking
        db_manager.add_tracking(
            registration_id=registration_id,
            status="submitted",
            notes="Pendaftaran dikonfirmasi melalui chatbot"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan data: {str(e)}")
    
    # Update state
    state.current_step = RegistrationStep.COMPLETED
    state_manager.update_session(session_id, state)
    
    return {
        "success": True,
        "registration_number": registration_number,
        "message": "Pendaftaran berhasil dikonfirmasi!",
        "school": state.student_data.nama_sekolah,
        "tingkatan": state.student_data.tingkatan,
        "next_steps": [
            "Lakukan pembayaran biaya pendaftaran",
            "Tunggu proses verifikasi dokumen (1-3 hari kerja)",
            "Anda akan menerima email konfirmasi"
        ]
    }


@app.get("/api/registration/status/{registration_number}")
async def get_registration_status(registration_number: str):
    """Get registration status by registration number"""
    
    registration = db_manager.get_registration_by_number(registration_number)
    
    if not registration:
        raise HTTPException(status_code=404, detail="Nomor registrasi tidak ditemukan")
    
    tracking = db_manager.get_registration_tracking(registration["id"])
    
    return {
        "registration_number": registration["registration_number"],
        "status": registration["status"],
        "last_updated": registration["updated_at"],
        "student_name": registration["student_data"].get("nama_lengkap", ""),
        "school": registration["student_data"].get("nama_sekolah", ""),
        "tingkatan": registration["student_data"].get("tingkatan", ""),
        "tracking_history": tracking
    }


@app.get("/api/stats/overview")
async def get_stats_overview():
    """Get statistics overview"""
    
    total_sessions = len(state_manager.states)
    active_sessions = sum(1 for s in state_manager.states.values() 
                         if s.current_step != RegistrationStep.COMPLETED)
    
    return {
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "completed_sessions": total_sessions - active_sessions,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/debug/session/{session_id}")
async def debug_session(session_id: str):
    """Debug endpoint untuk melihat detail session"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    return {
        "session_id": state.session_id,
        "current_step": state.current_step,
        "is_transactional": state.is_transactional,
        "completion_percentage": state.get_completion_percentage(),
        "missing_fields": state.get_missing_fields(),
        "student_data": state.student_data.dict(),
        "parent_data": state.parent_data.dict(),
        "academic_data": state.academic_data.dict(),
        "conversation_history": state.conversation_history,
        "created_at": state.created_at.isoformat(),
        "updated_at": state.updated_at.isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)