"""
Database Integration Module
Sesuai dengan BAB 3.4.4 - PostgreSQL untuk Relational Database
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, TIMESTAMP, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

Base = declarative_base()


# ==================== DATABASE MODELS ====================

class DocumentChunk(Base):
    """
    Table: document_chunks
    Menyimpan potongan dokumen dari knowledge base
    """
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON)
    status = Column(String(50), default='pending')
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    embeddings = relationship("DocumentEmbedding", back_populates="chunk")


class DocumentEmbedding(Base):
    """
    Table: document_embeddings
    Menyimpan embedding vector untuk semantic search
    """
    __tablename__ = "document_embeddings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    chunk_id = Column(Integer, ForeignKey('document_chunks.id'), nullable=False)
    vector = Column(JSON)  # Storing as JSON for simplicity
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    # Relationship
    chunk = relationship("DocumentChunk", back_populates="embeddings")


class StudentRegistration(Base):
    """
    Table: student_registrations
    Menyimpan data pendaftaran siswa
    """
    __tablename__ = "student_registrations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_number = Column(String(20), unique=True, nullable=False)
    student_data = Column(JSON)
    parent_data = Column(JSON)
    academic_data = Column(JSON)
    status = Column(String(50), default='draft')  # draft, submitted, verified, approved, rejected
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    documents = relationship("RegistrationDocument", back_populates="registration")
    tracking = relationship("RegistrationTracking", back_populates="registration")


class RegistrationDocument(Base):
    """
    Table: registration_documents
    Menyimpan dokumen upload untuk pendaftaran
    """
    __tablename__ = "registration_documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_id = Column(Integer, ForeignKey('student_registrations.id'), nullable=False)
    document_type = Column(String(50), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    status = Column(String(50), default='uploaded')  # uploaded, verified, rejected
    uploaded_at = Column(TIMESTAMP, default=datetime.now)
    
    # Relationship
    registration = relationship("StudentRegistration", back_populates="documents")


class RegistrationTracking(Base):
    """
    Table: registration_tracking
    Menyimpan history tracking status pendaftaran
    """
    __tablename__ = "registration_tracking"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_id = Column(Integer, ForeignKey('student_registrations.id'), nullable=False)
    status = Column(String(100), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    # Relationship
    registration = relationship("StudentRegistration", back_populates="tracking")


class Conversation(Base):
    """
    Table: conversations
    Menyimpan riwayat percakapan chatbot
    """
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=False, index=True)
    user_message = Column(Text)
    bot_response = Column(Text)
    intent = Column(String(50))  # informational, transactional
    created_at = Column(TIMESTAMP, default=datetime.now)


class ConversationStateDB(Base):
    """
    Table: conversation_state
    Menyimpan state percakapan untuk resume session
    """
    __tablename__ = "conversation_state"
    
    session_id = Column(String(100), primary_key=True)
    current_step = Column(String(50))
    collected_data = Column(JSON)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)


# ==================== DATABASE MANAGER ====================

class DatabaseManager:
    """Manager untuk operasi database"""
    
    def __init__(self, database_url: str):
        """
        Initialize database connection
        
        Args:
            database_url: PostgreSQL connection string
                         Format: postgresql://user:password@host:port/dbname
        """
        self.engine = create_engine(database_url, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def create_tables(self):
        """
        Create all tables if they don't exist
        SAFE: Tidak akan drop existing tables
        """
        Base.metadata.create_all(bind=self.engine)
    
    def drop_tables(self):
        """
        Drop all tables - USE WITH EXTREME CAUTION!
        Hanya gunakan untuk development/testing
        """
        print("⚠️  WARNING: Dropping all tables!")
        Base.metadata.drop_all(bind=self.engine)
    
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
    
    # ==================== REGISTRATION OPERATIONS ====================
    
    def save_registration(
        self,
        registration_number: str,
        student_data: Dict[str, Any],
        parent_data: Dict[str, Any],
        academic_data: Dict[str, Any],
        status: str = "draft"
    ) -> int:
        """
        Save registration data
        
        Returns:
            registration_id
        """
        session = self.get_session()
        
        try:
            registration = StudentRegistration(
                registration_number=registration_number,
                student_data=student_data,
                parent_data=parent_data,
                academic_data=academic_data,
                status=status
            )
            
            session.add(registration)
            session.commit()
            session.refresh(registration)
            
            # Add initial tracking
            tracking = RegistrationTracking(
                registration_id=registration.id,
                status="created",
                notes="Pendaftaran dibuat melalui chatbot"
            )
            session.add(tracking)
            session.commit()
            
            return registration.id
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def update_registration(
        self,
        registration_id: int,
        **kwargs
    ) -> bool:
        """Update registration data"""
        session = self.get_session()
        
        try:
            registration = session.query(StudentRegistration).filter_by(id=registration_id).first()
            
            if not registration:
                return False
            
            for key, value in kwargs.items():
                if hasattr(registration, key):
                    setattr(registration, key, value)
            
            registration.updated_at = datetime.now()
            session.commit()
            
            return True
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_registration_by_number(self, registration_number: str) -> Optional[Dict]:
        """Get registration by registration number"""
        session = self.get_session()
        
        try:
            registration = session.query(StudentRegistration).filter_by(
                registration_number=registration_number
            ).first()
            
            if not registration:
                return None
            
            return {
                "id": registration.id,
                "registration_number": registration.registration_number,
                "student_data": registration.student_data,
                "parent_data": registration.parent_data,
                "academic_data": registration.academic_data,
                "status": registration.status,
                "created_at": registration.created_at.isoformat(),
                "updated_at": registration.updated_at.isoformat()
            }
            
        finally:
            session.close()
    
    def add_registration_document(
        self,
        registration_id: int,
        document_type: str,
        filename: str,
        file_path: str
    ) -> int:
        """Add document to registration"""
        session = self.get_session()
        
        try:
            document = RegistrationDocument(
                registration_id=registration_id,
                document_type=document_type,
                filename=filename,
                file_path=file_path
            )
            
            session.add(document)
            session.commit()
            session.refresh(document)
            
            return document.id
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def add_tracking(
        self,
        registration_id: int,
        status: str,
        notes: Optional[str] = None
    ):
        """Add tracking entry"""
        session = self.get_session()
        
        try:
            tracking = RegistrationTracking(
                registration_id=registration_id,
                status=status,
                notes=notes
            )
            
            session.add(tracking)
            session.commit()
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_registration_tracking(self, registration_id: int) -> List[Dict]:
        """Get all tracking for a registration"""
        session = self.get_session()
        
        try:
            trackings = session.query(RegistrationTracking).filter_by(
                registration_id=registration_id
            ).order_by(RegistrationTracking.created_at.desc()).all()
            
            return [
                {
                    "status": t.status,
                    "notes": t.notes,
                    "created_at": t.created_at.isoformat()
                }
                for t in trackings
            ]
            
        finally:
            session.close()
    
    # ==================== CONVERSATION OPERATIONS ====================
    
    def save_conversation(
        self,
        session_id: str,
        user_message: str,
        bot_response: str,
        intent: Optional[str] = None
    ):
        """Save conversation message"""
        session = self.get_session()
        
        try:
            conversation = Conversation(
                session_id=session_id,
                user_message=user_message,
                bot_response=bot_response,
                intent=intent
            )
            
            session.add(conversation)
            session.commit()
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def save_conversation_state(
        self,
        session_id: str,
        current_step: str,
        collected_data: Dict[str, Any]
    ):
        """Save or update conversation state"""
        session = self.get_session()
        
        try:
            state = session.query(ConversationStateDB).filter_by(session_id=session_id).first()
            
            if state:
                # Update existing
                state.current_step = current_step
                state.collected_data = collected_data
                state.updated_at = datetime.now()
            else:
                # Create new
                state = ConversationStateDB(
                    session_id=session_id,
                    current_step=current_step,
                    collected_data=collected_data
                )
                session.add(state)
            
            session.commit()
            
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_conversation_state(self, session_id: str) -> Optional[Dict]:
        """Get conversation state"""
        session = self.get_session()
        
        try:
            state = session.query(ConversationStateDB).filter_by(session_id=session_id).first()
            
            if not state:
                return None
            
            return {
                "session_id": state.session_id,
                "current_step": state.current_step,
                "collected_data": state.collected_data,
                "created_at": state.created_at.isoformat(),
                "updated_at": state.updated_at.isoformat()
            }
            
        finally:
            session.close()


# ==================== USAGE EXAMPLE ====================

if __name__ == "__main__":
    """
    Untuk initialize database, gunakan script init_database.py
    
    Usage:
        python init_database.py              # Safe: hanya create missing tables
        python init_database.py --force      # DANGER: drop semua tables
        python init_database.py --sample-data  # Create sample data
    """
    print("⚠️  Jangan run database.py directly!")
    print("✓  Gunakan: python init_database.py")
