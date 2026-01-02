"""
FastAPI Backend - V3 Dynamic System
API Endpoints yang TIDAK MENGGANGGU frontend existing
Prefix: /api/v3/chatbot untuk isolasi
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import json

from dynamic_conversation_state import DynamicStateManager, DynamicConversationState
from dynamic_form_handler import DynamicFormHandler
from form_config import get_form_config
from database import DatabaseManager
from config import settings


app = FastAPI(
    title="YPI Al-Azhar Chatbot Backend V3",
    description="Dynamic form-based chatbot with JSON configuration",
    version="3.0.0",
    docs_url="/api/v3/chatbot/docs",  # Isolated docs
    redoc_url="/api/v3/chatbot/redoc"
)

# CORS - allow your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your FE domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
from llm_client import get_llm_client

state_manager = DynamicStateManager()
llm_client = get_llm_client()
form_handler = DynamicFormHandler(llm_client, state_manager)

# Database manager
db_manager = DatabaseManager(settings.DATABASE_URL)


# ==================== REQUEST/RESPONSE MODELS ====================

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    
class ChatResponse(BaseModel):
    session_id: str
    response: str
    current_section: str
    completion_percentage: float
    metadata: Dict[str, Any] = {}


class SessionInfo(BaseModel):
    session_id: str
    current_section: str
    completion_percentage: float
    created_at: str
    updated_at: str
    collected_data: Dict[str, Any]
    conversation_history: List[Dict[str, str]]


class FormConfigResponse(BaseModel):
    form_name: str
    version: str
    sections: List[Dict[str, Any]]


# ==================== API ENDPOINTS V3 ====================
# Prefix: /api/v3/chatbot
# Tidak mengganggu API existing di /api

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "YPI Al-Azhar Chatbot Backend V3",
        "status": "active",
        "version": "3.0.0",
        "api_prefix": "/api/v3/chatbot",
        "features": [
            "Dynamic JSON-based form configuration",
            "Flexible data storage",
            "Context-aware conversations",
            "Skip functionality",
            "Conditional fields"
        ]
    }


@app.get("/api/v3/chatbot/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "3.0.0"
    }


@app.post("/api/v3/chatbot/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - V3 Dynamic System
    
    Example:
    ```
    POST /api/v3/chatbot/chat
    {
        "session_id": "optional-session-id",
        "message": "Halo, nama saya Budi"
    }
    ```
    """
    
    # Generate or use existing session_id
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        # Process message with dynamic handler
        response, state = await form_handler.process_message(
            session_id,
            request.message
        )
        
        # Save to database
        db_manager.save_conversation(
            session_id=session_id,
            user_message=request.message,
            bot_response=response,
            intent="transactional"
        )
        
        # Save state
        db_manager.save_conversation_state(
            session_id=session_id,
            current_step=state.current_section,
            collected_data=state.to_dict()
        )
        
        return ChatResponse(
            session_id=session_id,
            response=response,
            current_section=state.current_section,
            completion_percentage=state.get_completion_percentage(),
            metadata={
                "messages_count": len(state.conversation_history),
                "can_advance": state.can_advance_section(),
                "missing_fields": state.get_missing_fields_for_section(state.current_section)
            }
        )
    
    except Exception as e:
        print(f"Error processing chat: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@app.post("/api/v3/chatbot/session/new")
async def create_new_session():
    """
    Create new chat session
    
    Returns session_id for subsequent chat calls
    """
    session_id = str(uuid.uuid4())
    state = state_manager.create_session(session_id)
    
    return {
        "session_id": session_id,
        "message": "Session created successfully",
        "current_section": state.current_section,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/v3/chatbot/session/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """
    Get session information
    
    Returns complete session state including:
    - Current section
    - Collected data
    - Conversation history
    - Completion percentage
    """
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionInfo(
        session_id=state.session_id,
        current_section=state.current_section,
        completion_percentage=state.get_completion_percentage(),
        created_at=state.created_at.isoformat(),
        updated_at=state.updated_at.isoformat(),
        collected_data=state.collected_data,
        conversation_history=state.get_last_messages(20)
    )


@app.delete("/api/v3/chatbot/session/{session_id}")
async def delete_session(session_id: str):
    """Delete session"""
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    state_manager.delete_session(session_id)
    
    return {
        "message": "Session deleted successfully",
        "session_id": session_id
    }


@app.get("/api/v3/chatbot/config", response_model=FormConfigResponse)
async def get_config():
    """
    Get current form configuration
    
    Useful for frontend to render form fields dynamically
    """
    config = get_form_config()
    return FormConfigResponse(
        form_name=config.config.get("form_name", "YPI Al-Azhar Registration"),
        version=config.config.get("version", "1.0"),
        sections=[s.to_dict() for s in config.get_all_sections()]
    )


@app.post("/api/v3/chatbot/upload/document")
async def upload_document(
    session_id: str = Form(...),
    field_name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload document
    
    Parameters:
    - session_id: Session ID
    - field_name: Field name (e.g., 'akta_kelahiran')
    - file: File to upload
    """
    from file_storage import get_file_storage
    
    # Validate session
    state = state_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
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
            document_type=field_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Update state
    state.set_field(field_name, file_path)
    state_manager.update_session(session_id, state)
    
    return {
        "success": True,
        "message": f"Document uploaded successfully",
        "field_name": field_name,
        "file_path": file_path
    }


@app.get("/api/v3/chatbot/summary/{session_id}")
async def get_summary(session_id: str):
    """
    Get registration summary
    
    Returns summary of all collected data
    """
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "completion_percentage": state.get_completion_percentage(),
        "current_section": state.current_section,
        "collected_data": state.collected_data,
        "summary": {
            "student_name": state.get_field("nama_lengkap") or "Not provided",
            "school": state.get_field("nama_sekolah") or "Not selected",
            "tingkatan": state.get_field("tingkatan") or "Not selected",
            "program": state.get_field("program") or "Not selected"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v3/chatbot/confirm/{session_id}")
async def confirm_registration(session_id: str):
    """
    Confirm and finalize registration
    
    Generates registration number and saves to database
    """
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate minimum completion
    if state.get_completion_percentage() < 50:
        raise HTTPException(
            status_code=400,
            detail="Registration incomplete. Minimum 50% required."
        )
    
    # Generate registration number
    year = datetime.now().year
    tingkatan = state.get_field("tingkatan") or "XX"
    
    # Determine code from tingkatan
    if "Playgroup" in tingkatan or "TK" in tingkatan:
        code = "TK"
    elif "Kelas 1" in tingkatan or "Kelas 2" in tingkatan or \
         "Kelas 3" in tingkatan or "Kelas 4" in tingkatan or \
         "Kelas 5" in tingkatan or "Kelas 6" in tingkatan:
        code = "SD"
    elif "Kelas 7" in tingkatan or "Kelas 8" in tingkatan or \
         "Kelas 9" in tingkatan:
        code = "MP"
    elif "Kelas 10" in tingkatan or "Kelas 11" in tingkatan or \
         "Kelas 12" in tingkatan:
        code = "MA"
    else:
        code = "XX"
    
    random_suffix = str(uuid.uuid4())[:8].upper()
    registration_number = f"AZHAR-{year}-{code}-{random_suffix}"
    
    # Save to database
    try:
        # Prepare data for database
        student_data = {k: v for k, v in state.collected_data.items() 
                       if k in ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 
                               'jenis_kelamin', 'agama', 'alamat', 'no_telepon', 'email',
                               'nama_sekolah', 'tahun_ajaran', 'program', 'tingkatan']}
        
        parent_data = {k: v for k, v in state.collected_data.items()
                      if k.startswith('nama_ayah') or k.startswith('nama_ibu') or 
                         k.startswith('no_telepon_') or k.startswith('pekerjaan_')}
        
        academic_data = {k: v for k, v in state.collected_data.items()
                        if k.startswith('nama_sekolah_asal') or k.startswith('tahun_lulus') or
                           k.startswith('nilai_')}
        
        registration_id = db_manager.save_registration(
            registration_number=registration_number,
            student_data=student_data or {},
            parent_data=parent_data or {},
            academic_data=academic_data or {},
            status="submitted"
        )
        
        # Add tracking
        db_manager.add_tracking(
            registration_id=registration_id,
            status="submitted",
            notes="Registration confirmed via chatbot V3"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
    
    return {
        "success": True,
        "registration_number": registration_number,
        "message": "Registration confirmed successfully!",
        "next_steps": [
            "Complete payment for registration fee",
            "Wait for document verification (1-3 business days)",
            "You will receive confirmation email"
        ],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/v3/chatbot/status/{registration_number}")
async def get_registration_status(registration_number: str):
    """
    Get registration status by registration number
    """
    registration = db_manager.get_registration_by_number(registration_number)
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    tracking = db_manager.get_registration_tracking(registration["id"])
    
    return {
        "registration_number": registration["registration_number"],
        "status": registration["status"],
        "last_updated": registration["updated_at"],
        "student_data": registration["student_data"],
        "tracking_history": tracking
    }


@app.get("/api/v3/chatbot/stats")
async def get_stats():
    """Get chatbot statistics"""
    
    total_sessions = len(state_manager.states)
    
    return {
        "total_sessions": total_sessions,
        "active_sessions": total_sessions,
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat()
    }


# ==================== DEBUG ENDPOINTS ====================

@app.get("/api/v3/chatbot/debug/session/{session_id}")
async def debug_session(session_id: str):
    """
    Debug endpoint - detailed session information
    
    For development/testing only
    """
    state = state_manager.get_session(session_id)
    
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    
    section = state.get_current_section_config()
    
    return {
        "session_id": state.session_id,
        "current_section": state.current_section,
        "completion_percentage": state.get_completion_percentage(),
        "can_advance": state.can_advance_section(),
        "collected_data": state.collected_data,
        "conversation_history": state.conversation_history,
        "current_section_config": section.to_dict() if section else None,
        "missing_fields": state.get_missing_fields_for_section(state.current_section),
        "created_at": state.created_at.isoformat(),
        "updated_at": state.updated_at.isoformat()
    }


@app.get("/api/v3/chatbot/debug/config")
async def debug_config():
    """
    Debug endpoint - view current configuration
    
    For development/testing only
    """
    config = get_form_config()
    return config.to_dict()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,  # Different port from existing backend
        reload=True
    )
