"""
FastAPI Backend Service untuk Transactional Chatbot
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import json

from conversation_state import StateManager, ConversationState, RegistrationStep
from conversational_form_handler import ConversationalFormHandler
from intent_classifier import IntentClassifier
from database import DatabaseManager
from config import settings


app = FastAPI(
    title="YPI Al-Azhar Transactional Chatbot API",
    description="API untuk chatbot pendaftaran siswa baru dengan LLM",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dalam production, specify domain yang diizinkan
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
    metadata: Dict[str, Any] = {}


class SessionInfo(BaseModel):
    session_id: str
    current_step: str
    completion_percentage: float
    created_at: str
    updated_at: str
    student_data: Dict[str, Any]
    parent_data: Dict[str, Any]
    academic_data: Dict[str, Any]


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    document_type: str
    file_path: Optional[str] = None


class RegistrationSummary(BaseModel):
    registration_number: Optional[str] = None
    student_name: str
    jenjang: str
    cabang: str
    status: str
    completion_percentage: float
    estimated_cost: Optional[float] = None


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "YPI Al-Azhar Transactional Chatbot",
        "status": "active",
        "version": "1.0.0"
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint untuk interaksi dengan chatbot
    
    Flow:
    1. Klasifikasi intent (informational vs transactional)
    2. Route ke handler yang sesuai
    3. Return response dengan metadata
    """
    
    # Generate atau gunakan existing session_id
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get or create session
    state = state_manager.get_session(session_id)
    if not state:
        state = state_manager.create_session(session_id)
    
    # Classify intent - apakah ini transactional request?
    intent = await intent_classifier.classify(request.message, state)
    
    if intent == "transactional":
        # Route ke conversational form handler
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
            metadata={
                "intent": "transactional",
                "missing_fields": updated_state.get_missing_fields(),
                "is_step_complete": updated_state.is_step_complete()
            }
        )
    
    else:
        # Route ke informational handler (RAG-based Q&A)
        # TODO: Implement RAG handler
        response = "Untuk pertanyaan informasi umum, sistem akan menggunakan RAG engine."
        
        # Save conversation to database
        db_manager.save_conversation(
            session_id=session_id,
            user_message=request.message,
            bot_response=response,
            intent="informational"
        )
        
        return ChatResponse(
            session_id=session_id,
            response=response,
            current_step="informational",
            completion_percentage=0.0,
            metadata={
                "intent": "informational"
            }
        )


@app.post("/api/session/new")
async def create_new_session():
    """Create new registration session"""
    session_id = str(uuid.uuid4())
    state = state_manager.create_session(session_id)
    
    return {
        "session_id": session_id,
        "message": "Session baru telah dibuat",
        "current_step": state.current_step
    }


@app.get("/api/session/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """Get session information"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    return SessionInfo(
        session_id=state.session_id,
        current_step=state.current_step,
        completion_percentage=state.get_completion_percentage(),
        created_at=state.created_at.isoformat(),
        updated_at=state.updated_at.isoformat(),
        student_data=state.student_data.dict(),
        parent_data=state.parent_data.dict(),
        academic_data=state.academic_data.dict()
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
    """
    Upload dokumen persyaratan
    
    Document types:
    - akta_kelahiran
    - kartu_keluarga
    - foto_siswa
    - ijazah_terakhir
    - rapor_terakhir
    - surat_keterangan_sehat
    """
    
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
    
    # Calculate estimated cost berdasarkan jenjang
    # TODO: Implement actual cost calculation dari database
    cost_mapping = {
        "TK": 5000000,
        "SD": 7500000,
        "SMP": 10000000,
        "SMA": 12500000
    }
    
    estimated_cost = cost_mapping.get(state.student_data.jenjang_tujuan, 0)
    
    return RegistrationSummary(
        registration_number=None,  # Will be generated after confirmation
        student_name=state.student_data.nama_lengkap or "Belum diisi",
        jenjang=state.student_data.jenjang_tujuan or "Belum dipilih",
        cabang=state.student_data.cabang_tujuan or "Belum dipilih",
        status=state.current_step,
        completion_percentage=state.get_completion_percentage(),
        estimated_cost=estimated_cost if state.student_data.jenjang_tujuan else None
    )


@app.post("/api/registration/confirm/{session_id}")
async def confirm_registration(session_id: str):
    """
    Confirm and finalize registration
    Generate registration number dan save to database
    """
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    
    # Validate completeness
    if state.get_completion_percentage() < 80:  # Minimal 80% complete
        raise HTTPException(
            status_code=400, 
            detail="Data pendaftaran belum lengkap. Minimal 80% harus terisi."
        )
    
    # Generate registration number
    # Format: AZHAR-{TAHUN}-{JENJANG}-{RANDOM}
    year = datetime.now().year
    jenjang_code = {
        "TK": "TK",
        "SD": "SD",
        "SMP": "MP",
        "SMA": "MA"
    }.get(state.student_data.jenjang_tujuan, "XX")
    
    random_suffix = str(uuid.uuid4())[:8].upper()
    registration_number = f"AZHAR-{year}-{jenjang_code}-{random_suffix}"
    
    # Save to database
    try:
        registration_id = db_manager.save_registration(
            registration_number=registration_number,
            student_data=state.student_data.dict(),
            parent_data=state.parent_data.dict(),
            academic_data=state.academic_data.dict(),
            status="submitted"
        )
        
        # Save documents to database
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
    
    # Update state to completed
    state.current_step = RegistrationStep.COMPLETED
    state_manager.update_session(session_id, state)
    
    # Update conversation state in database
    db_manager.save_conversation_state(
        session_id=session_id,
        current_step=state.current_step,
        collected_data=state.to_dict()
    )
    
    return {
        "success": True,
        "registration_number": registration_number,
        "message": "Pendaftaran berhasil dikonfirmasi",
        "next_steps": [
            "Lakukan pembayaran biaya pendaftaran",
            "Tunggu proses verifikasi dokumen (1-3 hari kerja)",
            "Anda akan menerima email konfirmasi"
        ]
    }


@app.get("/api/registration/status/{registration_number}")
async def get_registration_status(registration_number: str):
    """Get registration status by registration number"""
    
    # Query from database
    registration = db_manager.get_registration_by_number(registration_number)
    
    if not registration:
        raise HTTPException(status_code=404, detail="Nomor registrasi tidak ditemukan")
    
    # Get tracking history
    tracking = db_manager.get_registration_tracking(registration["id"])
    
    return {
        "registration_number": registration["registration_number"],
        "status": registration["status"],
        "last_updated": registration["updated_at"],
        "student_name": registration["student_data"].get("nama_lengkap", ""),
        "jenjang": registration["student_data"].get("jenjang_tujuan", ""),
        "tracking_history": tracking
    }


@app.get("/api/stats/overview")
async def get_stats_overview():
    """Get statistics overview - untuk admin dashboard"""
    
    # TODO: Implement actual stats from database
    return {
        "total_sessions": len(state_manager.states),
        "active_registrations": 0,
        "completed_registrations": 0,
        "pending_verifications": 0,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
