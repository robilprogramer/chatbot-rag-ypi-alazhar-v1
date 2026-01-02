"""
Dynamic Conversation State - JSON-based
Data disimpan sebagai flexible JSON, bukan fixed Pydantic models
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
import json

from form_config import get_form_config, FormConfigManager


class DynamicConversationState(BaseModel):
    """
    Dynamic state management - data stored as flexible JSON
    Tidak perlu update model jika ada perubahan field
    """
    session_id: str
    current_section: str = "school_info"  # Current section being filled
    
    # FLEXIBLE JSON STORAGE - bisa tampung field apapun
    collected_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Tracking
    current_field: Optional[str] = None
    pending_confirmation: bool = False
    
    # Conversation history
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    
    # Mode tracking
    is_transactional: bool = True
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # Form config reference
    form_config: Optional[Dict[str, Any]] = None
    
    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        # Load form config if not provided
        if self.form_config is None:
            config_manager = get_form_config()
            self.form_config = config_manager.to_dict()
    
    def get_data_for_section(self, section_name: str) -> Dict[str, Any]:
        """Get all data for a specific section"""
        return {
            k: v for k, v in self.collected_data.items()
            if self._is_field_in_section(k, section_name)
        }
    
    def _is_field_in_section(self, field_name: str, section_name: str) -> bool:
        """Check if field belongs to section"""
        config_manager = get_form_config()
        section = config_manager.get_section(section_name)
        if not section:
            return False
        return any(f.name == field_name for f in section.fields)
    
    def set_field(self, field_name: str, value: Any):
        """Set a field value"""
        self.collected_data[field_name] = value
        self.updated_at = datetime.now()
    
    def get_field(self, field_name: str) -> Any:
        """Get a field value"""
        return self.collected_data.get(field_name)
    
    def add_message(self, role: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now()
    
    def get_last_messages(self, n: int = 5) -> List[Dict[str, str]]:
        """Get last N messages"""
        return self.conversation_history[-n:] if self.conversation_history else []
    
    def get_conversation_context(self) -> str:
        """Get formatted conversation context"""
        if not self.conversation_history:
            return "Belum ada percakapan sebelumnya."
        
        context_parts = []
        for msg in self.conversation_history[-10:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            context_parts.append(f"{role}: {msg['content']}")
        
        return "\n".join(context_parts)
    
    def get_completion_percentage(self) -> float:
        """Calculate completion percentage based on form config"""
        config_manager = get_form_config()
        total_required = 0
        filled_required = 0
        
        for section in config_manager.get_all_sections():
            # Count required fields in this section
            section_required = section.required_fields
            total_required += section_required
            
            # Count filled fields
            section_data = self.get_data_for_section(section.name)
            filled_count = sum(1 for v in section_data.values() if v)
            filled_required += min(filled_count, section_required)
        
        return (filled_required / total_required * 100) if total_required > 0 else 0.0
    
    def get_missing_fields_for_section(self, section_name: str) -> List[str]:
        """Get missing fields for current section"""
        config_manager = get_form_config()
        section = config_manager.get_section(section_name)
        if not section:
            return []
        
        section_data = self.get_data_for_section(section_name)
        missing = []
        
        for field in section.fields:
            # Check if field is required and missing
            is_required = config_manager.is_field_required(
                section_name, 
                field.name, 
                self.collected_data
            )
            
            if is_required and not section_data.get(field.name):
                missing.append(field.name)
        
        return missing
    
    def is_section_complete(self, section_name: str) -> bool:
        """Check if section is complete"""
        config_manager = get_form_config()
        section = config_manager.get_section(section_name)
        if not section:
            return False
        
        section_data = self.get_data_for_section(section_name)
        filled_count = sum(1 for v in section_data.values() if v)
        
        return filled_count >= section.required_fields
    
    def can_advance_section(self) -> bool:
        """Check if can advance to next section"""
        return self.is_section_complete(self.current_section)
    
    def advance_section(self):
        """Move to next section"""
        config_manager = get_form_config()
        sections = config_manager.get_all_sections()
        section_names = [s.name for s in sections]
        
        try:
            current_index = section_names.index(self.current_section)
            if current_index < len(section_names) - 1:
                self.current_section = section_names[current_index + 1]
                self.current_field = None
                self.updated_at = datetime.now()
        except ValueError:
            pass
    
    def get_current_section_config(self):
        """Get configuration for current section"""
        config_manager = get_form_config()
        return config_manager.get_section(self.current_section)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            "session_id": self.session_id,
            "current_section": self.current_section,
            "collected_data": self.collected_data,
            "current_field": self.current_field,
            "pending_confirmation": self.pending_confirmation,
            "conversation_history": self.conversation_history,
            "is_transactional": self.is_transactional,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "form_config": self.form_config
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DynamicConversationState":
        """Load from dictionary"""
        # Convert datetime strings back to datetime objects
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("updated_at"), str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        
        return cls(**data)
    
    def to_json(self) -> str:
        """Export as JSON string"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> "DynamicConversationState":
        """Load from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)


class DynamicStateManager:
    """Manager untuk mengelola dynamic conversation states"""
    
    def __init__(self, form_config: Optional[FormConfigManager] = None):
        self.states: Dict[str, DynamicConversationState] = {}
        self.form_config = form_config or get_form_config()
    
    def create_session(self, session_id: str) -> DynamicConversationState:
        """Create new session"""
        state = DynamicConversationState(
            session_id=session_id,
            is_transactional=True,
            form_config=self.form_config.to_dict()
        )
        self.states[session_id] = state
        return state
    
    def get_session(self, session_id: str) -> Optional[DynamicConversationState]:
        """Get existing session"""
        return self.states.get(session_id)
    
    def update_session(self, session_id: str, state: DynamicConversationState):
        """Update session"""
        self.states[session_id] = state
    
    def delete_session(self, session_id: str):
        """Delete session"""
        if session_id in self.states:
            del self.states[session_id]
    
    def save_to_db(self, session_id: str, db_connection):
        """Save state to database as JSON"""
        state = self.states.get(session_id)
        if state:
            # Save as JSON in database
            json_data = state.to_json()
            # TODO: Implement database save
            # db.execute("UPDATE sessions SET data = ? WHERE id = ?", json_data, session_id)
            pass
    
    def load_from_db(self, session_id: str, db_connection) -> Optional[DynamicConversationState]:
        """Load state from database"""
        # TODO: Implement database load
        # json_data = db.query("SELECT data FROM sessions WHERE id = ?", session_id)
        # return DynamicConversationState.from_json(json_data)
        pass


if __name__ == "__main__":
    # Example usage
    print("="*60)
    print("Dynamic Conversation State - Demo")
    print("="*60)
    
    # Create state
    state = DynamicConversationState(session_id="test-001")
    
    # Set some data (dynamic - bisa field apapun!)
    state.set_field("nama_sekolah", "TK Islam Al Azhar 1 Kebayoran Baru")
    state.set_field("tingkatan", "Playgroup")
    state.set_field("program", "Reguler")
    state.set_field("nama_lengkap", "Ahmad Fauzi")
    state.set_field("tanggal_lahir", "15/05/2018")
    
    # Bahkan bisa tambah custom field yang tidak ada di config!
    state.set_field("custom_notes", "Anak punya alergi seafood")
    
    print("\nCollected Data:")
    for key, value in state.collected_data.items():
        print(f"  {key}: {value}")
    
    print(f"\nCompletion: {state.get_completion_percentage():.1f}%")
    print(f"Current Section: {state.current_section}")
    print(f"Can Advance: {state.can_advance_section()}")
    
    # Export to JSON
    json_str = state.to_json()
    print("\n" + "="*60)
    print("JSON Export:")
    print("="*60)
    print(json_str[:500] + "...")
    
    # Load from JSON
    state2 = DynamicConversationState.from_json(json_str)
    print(f"\n✅ Loaded from JSON - Data intact: {state2.get_field('nama_lengkap')}")
