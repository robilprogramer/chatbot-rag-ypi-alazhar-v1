"""
Configuration Management
Load environment variables dan settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "YPI Al-Azhar Transactional Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ypi_alazhar"
    
    # LLM API Configuration (pilih salah satu)
    LLM_PROVIDER: str = "openai"  # options: openai, anthropic, azure
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 500
    
    # Anthropic Claude
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"
    
    # Vector Database (ChromaDB)
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "ypi_knowledge_base"
    
    # Embedding Model
    EMBEDDING_MODEL: str = "text-embedding-ada-002"  # OpenAI
    # EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"  # Local alternative
    
    # File Upload Settings
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".jpg", ".jpeg", ".png"]
    
    # Session Management
    SESSION_TIMEOUT: int = 3600  # 1 hour in seconds
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Settings
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # RAG Settings
    RAG_TOP_K: int = 5  # Number of documents to retrieve
    RAG_SIMILARITY_THRESHOLD: float = 0.7
    
    # Conversation Settings
    MAX_CONVERSATION_HISTORY: int = 10  # Keep last N messages
    
    # Cost Estimation (dalam Rupiah)
    COST_TK: int = 5_000_000
    COST_SD: int = 7_500_000
    COST_SMP: int = 10_000_000
    COST_SMA: int = 12_500_000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Initialize settings
settings = Settings()


# Create necessary directories
def create_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        settings.UPLOAD_DIR,
        settings.CHROMA_PERSIST_DIRECTORY,
        os.path.dirname(settings.LOG_FILE)
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)


# Validation
def validate_settings():
    """Validate critical settings"""
    errors = []
    
    # Check LLM API keys
    if settings.LLM_PROVIDER == "openai" and not settings.OPENAI_API_KEY:
        errors.append("OPENAI_API_KEY is required when using OpenAI provider")
    
    if settings.LLM_PROVIDER == "anthropic" and not settings.ANTHROPIC_API_KEY:
        errors.append("ANTHROPIC_API_KEY is required when using Anthropic provider")
    
    # Check database URL
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL is required")
    
    if errors:
        raise ValueError(f"Configuration errors: {', '.join(errors)}")


if __name__ == "__main__":
    print("Current Settings:")
    print(f"App Name: {settings.APP_NAME}")
    print(f"LLM Provider: {settings.LLM_PROVIDER}")
    print(f"Database URL: {settings.DATABASE_URL}")
    print(f"Upload Directory: {settings.UPLOAD_DIR}")
