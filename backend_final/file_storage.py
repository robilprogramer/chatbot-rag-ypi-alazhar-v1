"""
File Storage Handler
Handle actual file uploads dengan storage ke local filesystem atau cloud
"""

import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
from config import settings
import shutil


class FileStorageHandler:
    """Handle file upload and storage"""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_extensions = settings.ALLOWED_EXTENSIONS
        
        # Create upload directory if not exists
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """
        Validate file upload
        
        Returns:
            (is_valid, error_message)
        """
        
        # Check file size
        if file_size > self.max_file_size:
            max_mb = self.max_file_size / (1024 * 1024)
            return False, f"File terlalu besar. Maksimal {max_mb}MB"
        
        # Check extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.allowed_extensions:
            return False, f"Format file tidak didukung. Gunakan: {', '.join(self.allowed_extensions)}"
        
        return True, None
    
    def save_file(
        self, 
        file_content: bytes, 
        original_filename: str,
        session_id: str,
        document_type: str
    ) -> str:
        """
        Save uploaded file to storage
        
        Args:
            file_content: Binary file content
            original_filename: Original filename from upload
            session_id: User session ID
            document_type: Type of document (e.g., 'akta_kelahiran')
            
        Returns:
            file_path: Path to saved file
        """
        
        # Create session directory
        session_dir = self.upload_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_ext = Path(original_filename).suffix.lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        new_filename = f"{document_type}_{timestamp}_{unique_id}{file_ext}"
        
        # Full file path
        file_path = session_dir / new_filename
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Return relative path (for database storage)
        return str(file_path.relative_to(self.upload_dir))
    
    def get_file_path(self, relative_path: str) -> Path:
        """Get absolute file path from relative path"""
        return self.upload_dir / relative_path
    
    def delete_file(self, relative_path: str) -> bool:
        """Delete a file"""
        try:
            file_path = self.get_file_path(relative_path)
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def delete_session_files(self, session_id: str) -> bool:
        """Delete all files for a session"""
        try:
            session_dir = self.upload_dir / session_id
            if session_dir.exists():
                shutil.rmtree(session_dir)
                return True
            return False
        except Exception as e:
            print(f"Error deleting session files: {e}")
            return False
    
    def get_file_info(self, relative_path: str) -> Optional[dict]:
        """Get file information"""
        try:
            file_path = self.get_file_path(relative_path)
            if not file_path.exists():
                return None
            
            stat = file_path.stat()
            return {
                "filename": file_path.name,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime),
                "modified": datetime.fromtimestamp(stat.st_mtime),
            }
        except Exception as e:
            print(f"Error getting file info: {e}")
            return None


# Singleton instance
_file_storage = None

def get_file_storage() -> FileStorageHandler:
    """Get singleton file storage instance"""
    global _file_storage
    if _file_storage is None:
        _file_storage = FileStorageHandler()
    return _file_storage
