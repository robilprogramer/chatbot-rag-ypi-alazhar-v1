"""
Conversation State Manager untuk Multi-Step Registration Form
Sesuai dengan BAB 3.4.6 - Perancangan Conversation Flow (Mode Transactional)
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
import json


class RegistrationStep(str, Enum):
    """Tahapan proses pendaftaran siswa baru"""
    GREETING = "greeting"
    STUDENT_DATA = "student_data"
    PARENT_DATA = "parent_data"
    ACADEMIC_DATA = "academic_data"
    DOCUMENT_UPLOAD = "document_upload"
    CONFIRMATION = "confirmation"
    COMPLETED = "completed"


class StudentData(BaseModel):
    """Model data siswa sesuai schema database"""
    nama_lengkap: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    jenis_kelamin: Optional[str] = None
    agama: Optional[str] = None
    alamat: Optional[str] = None
    no_telepon: Optional[str] = None
    email: Optional[str] = None
    jenjang_tujuan: Optional[str] = None  # TK, SD, SMP, SMA
    cabang_tujuan: Optional[str] = None  # Lokasi sekolah


class ParentData(BaseModel):
    """Model data orang tua/wali"""
    nama_ayah: Optional[str] = None
    pekerjaan_ayah: Optional[str] = None
    no_telepon_ayah: Optional[str] = None
    nama_ibu: Optional[str] = None
    pekerjaan_ibu: Optional[str] = None
    no_telepon_ibu: Optional[str] = None
    nama_wali: Optional[str] = None
    hubungan_wali: Optional[str] = None
    no_telepon_wali: Optional[str] = None


class AcademicData(BaseModel):
    """Model data akademik"""
    nama_sekolah_asal: Optional[str] = None
    alamat_sekolah_asal: Optional[str] = None
    tahun_lulus: Optional[str] = None
    nilai_rata_rata: Optional[str] = None
    prestasi: Optional[List[str]] = Field(default_factory=list)


class DocumentUpload(BaseModel):
    """Model dokumen yang diupload"""
    akta_kelahiran: Optional[str] = None
    kartu_keluarga: Optional[str] = None
    foto_siswa: Optional[str] = None
    ijazah_terakhir: Optional[str] = None
    rapor_terakhir: Optional[str] = None
    surat_keterangan_sehat: Optional[str] = None


class ConversationState(BaseModel):
    """State management untuk percakapan pendaftaran"""
    session_id: str
    current_step: RegistrationStep = RegistrationStep.GREETING
    student_data: StudentData = Field(default_factory=StudentData)
    parent_data: ParentData = Field(default_factory=ParentData)
    academic_data: AcademicData = Field(default_factory=AcademicData)
    documents: DocumentUpload = Field(default_factory=DocumentUpload)
    
    # Tracking field yang sedang dikumpulkan
    current_field: Optional[str] = None
    pending_confirmation: bool = False
    
    # Conversation history untuk context LLM
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary untuk database storage"""
        return {
            "session_id": self.session_id,
            "current_step": self.current_step,
            "student_data": self.student_data.dict(),
            "parent_data": self.parent_data.dict(),
            "academic_data": self.academic_data.dict(),
            "documents": self.documents.dict(),
            "current_field": self.current_field,
            "pending_confirmation": self.pending_confirmation,
            "conversation_history": self.conversation_history,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationState":
        """Load from dictionary"""
        return cls(**data)

    def add_message(self, role: str, content: str):
        """Tambah message ke conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now()
    
    def get_completion_percentage(self) -> float:
        """Hitung persentase kelengkapan data"""
        total_fields = 0
        filled_fields = 0
        
        # Count student data
        student_dict = self.student_data.dict()
        total_fields += len(student_dict)
        filled_fields += sum(1 for v in student_dict.values() if v is not None)
        
        # Count parent data
        parent_dict = self.parent_data.dict()
        total_fields += len(parent_dict)
        filled_fields += sum(1 for v in parent_dict.values() if v is not None)
        
        # Count academic data
        academic_dict = self.academic_data.dict()
        total_fields += len(academic_dict)
        filled_fields += sum(1 for v in academic_dict.values() if v is not None and v != [])
        
        # Count documents
        doc_dict = self.documents.dict()
        total_fields += len(doc_dict)
        filled_fields += sum(1 for v in doc_dict.values() if v is not None)
        
        return (filled_fields / total_fields * 100) if total_fields > 0 else 0.0

    def get_current_step_fields(self) -> List[str]:
        """Get list of fields untuk step saat ini"""
        field_mapping = {
            RegistrationStep.STUDENT_DATA: list(self.student_data.dict().keys()),
            RegistrationStep.PARENT_DATA: list(self.parent_data.dict().keys()),
            RegistrationStep.ACADEMIC_DATA: list(self.academic_data.dict().keys()),
            RegistrationStep.DOCUMENT_UPLOAD: list(self.documents.dict().keys()),
        }
        return field_mapping.get(self.current_step, [])
    
    def get_missing_fields(self) -> List[str]:
        """Get list of fields yang masih kosong di step saat ini"""
        current_fields = self.get_current_step_fields()
        missing = []
        
        if self.current_step == RegistrationStep.STUDENT_DATA:
            data_dict = self.student_data.dict()
        elif self.current_step == RegistrationStep.PARENT_DATA:
            data_dict = self.parent_data.dict()
        elif self.current_step == RegistrationStep.ACADEMIC_DATA:
            data_dict = self.academic_data.dict()
        elif self.current_step == RegistrationStep.DOCUMENT_UPLOAD:
            data_dict = self.documents.dict()
        else:
            return []
        
        for field in current_fields:
            value = data_dict.get(field)
            if value is None or value == [] or value == "":
                missing.append(field)
        
        return missing
    
    def is_step_complete(self) -> bool:
        """Check apakah step saat ini sudah lengkap"""
        return len(self.get_missing_fields()) == 0
    
    def advance_step(self):
        """Pindah ke step berikutnya"""
        steps = list(RegistrationStep)
        current_index = steps.index(self.current_step)
        
        if current_index < len(steps) - 1:
            self.current_step = steps[current_index + 1]
            self.current_field = None
            self.updated_at = datetime.now()


class StateManager:
    """Manager untuk mengelola conversation states"""
    
    def __init__(self):
        self.states: Dict[str, ConversationState] = {}
    
    def create_session(self, session_id: str) -> ConversationState:
        """Buat session baru"""
        state = ConversationState(session_id=session_id)
        self.states[session_id] = state
        return state
    
    def get_session(self, session_id: str) -> Optional[ConversationState]:
        """Ambil session yang ada"""
        return self.states.get(session_id)
    
    def update_session(self, session_id: str, state: ConversationState):
        """Update session"""
        self.states[session_id] = state
    
    def delete_session(self, session_id: str):
        """Hapus session"""
        if session_id in self.states:
            del self.states[session_id]
    
    def save_to_db(self, session_id: str, db_connection):
        """Save state ke database (akan diimplementasi dengan PostgreSQL)"""
        state = self.states.get(session_id)
        if state:
            # TODO: Implement database save
            pass
    
    def load_from_db(self, session_id: str, db_connection) -> Optional[ConversationState]:
        """Load state dari database"""
        # TODO: Implement database load
        pass
