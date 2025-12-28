# YPI Al-Azhar Transactional Chatbot Backend

Backend system untuk chatbot pendaftaran siswa baru YPI Al-Azhar Jakarta menggunakan Large Language Model dengan pendekatan Retrieval Augmented Generation (RAG).

## ⚡ Production Ready!

✅ **Fully Implemented** - Bukan simulasi lagi!
- Real LLM integration (OpenAI/Anthropic)
- PostgreSQL database dengan safe migrations
- Actual file storage system
- Complete CRUD operations
- Session & conversation persistence

## 📋 Deskripsi

Sistem ini merupakan implementasi dari skripsi "Sistem Chatbot Berbasis Large Language Model dengan Retrieval Augmented Generation pada Yayasan Pesantren Islam Al-Azhar Jakarta".

### Fitur Utama

1. **Mode Transaksional (Pendaftaran Siswa Baru)**
   - Conversational form filling dengan LLM
   - Multi-step interactive registration process
   - Automatic data extraction dari natural language
   - Document upload & validation
   - Real-time registration status tracking

2. **Mode Informasional (Q&A)**
   - RAG-based question answering
   - Semantic search menggunakan vector database
   - Context-aware responses

3. **Intent Classification**
   - Automatic routing: informational vs transactional
   - LLM-powered intent recognition

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│              User Interface (Frontend)               │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              FastAPI Backend (main.py)               │
│  ┌─────────────────────────────────────────────┐   │
│  │        Intent Classifier                     │   │
│  └──────────┬──────────────────────┬────────────┘   │
│             │                      │                 │
│    ┌────────▼────────┐    ┌───────▼──────────┐     │
│    │ Conversational  │    │   RAG Engine      │     │
│    │  Form Handler   │    │  (Informational)  │     │
│    └────────┬────────┘    └───────┬───────────┘     │
│             │                     │                  │
│    ┌────────▼─────────────────────▼──────────┐      │
│    │       State Manager & Database          │      │
│    └─────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
           │                        │
   ┌───────▼────────┐      ┌───────▼─────────┐
   │   PostgreSQL    │      │    ChromaDB     │
   │   (Relational)  │      │ (Vector Store)  │
   └─────────────────┘      └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 12+
- OpenAI API Key atau Anthropic API Key

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd transactional_bot
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate  # Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup PostgreSQL Database**
```bash
# Buat database
sudo -u postgres psql
CREATE DATABASE ypi_alazhar;
\q
```

5. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda:
# - DATABASE_URL
# - OPENAI_API_KEY atau ANTHROPIC_API_KEY
```

6. **Initialize database (SAFE - tidak akan drop existing tables)**
```bash
python init_database.py

# Dengan sample data untuk testing
python init_database.py --sample-data
```

7. **Run server**
```bash
python main.py
# atau
uvicorn main:app --reload
```

Server akan berjalan di `http://localhost:8000`

📖 **Panduan Setup Lengkap**: Lihat [SETUP.md](SETUP.md)

## 📁 Struktur File

```
transactional_bot/
├── main.py                          # ✅ FastAPI app & API endpoints (PRODUCTION)
├── llm_client.py                    # ✅ LLM client (OpenAI/Anthropic)
├── conversation_state.py            # ✅ State management
├── conversational_form_handler.py   # ✅ LLM-powered form handler
├── intent_classifier.py             # ✅ Intent classification
├── database.py                      # ✅ SQLAlchemy models & operations
├── file_storage.py                  # ✅ File upload & storage handler
├── init_database.py                 # ✅ Safe database initialization
├── config.py                        # ✅ Configuration management
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
├── README.md                        # Documentation
└── SETUP.md                         # Detailed setup guide
```

## 🔧 Konfigurasi

### Environment Variables

Edit file `.env` sesuai kebutuhan:

```env
# LLM Provider
LLM_PROVIDER=openai  # atau anthropic

# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ypi_alazhar

# ChromaDB
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

### Database Schema

Sistem menggunakan beberapa tabel utama:

1. **student_registrations**: Data pendaftaran siswa
2. **registration_documents**: Dokumen yang diupload
3. **registration_tracking**: History tracking status
4. **conversations**: Riwayat percakapan
5. **conversation_state**: State management untuk resume session

Lihat `database.py` untuk schema lengkap.

## 📡 API Endpoints

### Chat Endpoints

#### POST /api/chat
Main endpoint untuk interaksi chatbot

**Request:**
```json
{
  "session_id": "optional-session-id",
  "message": "Saya ingin mendaftarkan anak saya"
}
```

**Response:**
```json
{
  "session_id": "generated-or-existing-id",
  "response": "Baik, saya akan membantu proses pendaftaran...",
  "current_step": "student_data",
  "completion_percentage": 15.5,
  "metadata": {
    "intent": "transactional",
    "missing_fields": ["nama_lengkap", "tempat_lahir"]
  }
}
```

### Session Management

#### POST /api/session/new
Membuat session baru

#### GET /api/session/{session_id}
Mendapatkan informasi session

#### DELETE /api/session/{session_id}
Menghapus session

### Document Upload

#### POST /api/upload/document
Upload dokumen persyaratan

**Form Data:**
- `session_id`: Session ID
- `document_type`: Tipe dokumen (akta_kelahiran, kartu_keluarga, dll)
- `file`: File yang diupload

### Registration

#### GET /api/registration/summary/{session_id}
Mendapatkan ringkasan pendaftaran

#### POST /api/registration/confirm/{session_id}
Konfirmasi dan finalisasi pendaftaran

#### GET /api/registration/status/{registration_number}
Cek status pendaftaran

## 🧪 Testing

### Manual Testing dengan cURL

```bash
# Create new session
curl -X POST http://localhost:8000/api/session/new

# Send message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message": "Saya mau daftar anak saya ke SD Al-Azhar"
  }'

# Upload document
curl -X POST http://localhost:8000/api/upload/document \
  -F "session_id=your-session-id" \
  -F "document_type=akta_kelahiran" \
  -F "file=@/path/to/document.pdf"
```

### API Documentation

Swagger UI tersedia di: `http://localhost:8000/docs`

ReDoc tersedia di: `http://localhost:8000/redoc`

## 💡 Teknik & Best Practices

### 1. Multi-turn Conversation dengan LLM

```python
# System prompt disesuaikan dengan context
system_prompt = get_system_prompt(state)

# Conversation history untuk context
messages = [
    {"role": "system", "content": system_prompt},
    *conversation_history,
    {"role": "user", "content": user_message}
]

response = llm.generate(messages)
```

### 2. Structured Data Extraction

```python
# Few-shot prompting untuk ekstraksi terstruktur
extraction_prompt = f"""
Extract data dari: "{user_message}"
Return JSON format.

Contoh:
Input: "Nama saya Ahmad, lahir di Jakarta"
Output: {{"nama_lengkap": "Ahmad", "tempat_lahir": "Jakarta"}}
"""

extracted_data = llm.generate(extraction_prompt, temperature=0.1)
```

### 3. State Management

```python
# Persistent state untuk resume session
state = ConversationState(
    session_id=session_id,
    current_step=RegistrationStep.STUDENT_DATA,
    student_data=StudentData(),
    conversation_history=[]
)

# Auto-save ke database
db.save_conversation_state(session_id, state.to_dict())
```

### 4. Intent Classification

```python
# Hybrid approach: rules + LLM
if "daftar" in message.lower():
    intent = "transactional"
else:
    intent = await llm_classify(message)
```

## 🔐 Security Considerations

1. **API Key Protection**: Jangan commit `.env` file
2. **Input Validation**: Validate semua user input
3. **File Upload**: Validate file type, size, dan content
4. **SQL Injection**: Gunakan SQLAlchemy ORM
5. **Rate Limiting**: Implement untuk production
6. **CORS**: Configure allowed origins

## 📊 Monitoring & Logging

```python
from loguru import logger

logger.info(f"New session created: {session_id}")
logger.warning(f"Invalid file upload attempt: {filename}")
logger.error(f"Database error: {error}")
```

## 🚧 Development Roadmap

### ✅ Completed (Production Ready)
- [x] LLM integration (OpenAI & Anthropic)
- [x] PostgreSQL database dengan safe schema management
- [x] File upload & storage system
- [x] Multi-step conversational form
- [x] Intent classification
- [x] Session management
- [x] Conversation history
- [x] Registration workflow dengan database
- [x] Document management
- [x] Status tracking

### 🔄 In Progress / Future
- [ ] RAG Engine untuk mode informasional
- [ ] Integration dengan payment gateway
- [ ] SMS/Email notification system
- [ ] Admin dashboard untuk monitoring
- [ ] Analytics & reporting
- [ ] Multi-language support
- [ ] Voice input integration

## ⚠️ Database Safety

### ✅ AMAN (Recommended)
```python
# Hanya create tables yang belum ada
python init_database.py
```

### ⚠️ BAHAYA (Development Only!)
```python
# DROP semua tables - HANYA untuk development!
python init_database.py --force
```

**Catatan Penting:**
- `create_tables()` **TIDAK** akan drop existing tables
- Existing data **AMAN**
- Gunakan migrations (Alembic) untuk schema changes di production

## 📝 Sesuai dengan Skripsi

Implementasi ini mengikuti:

- **BAB 3.3**: Analisis Kebutuhan Sistem
- **BAB 3.4.1**: Arsitektur Sistem (Microservices)
- **BAB 3.4.4**: Database Schema (PostgreSQL)
- **BAB 3.4.5**: RAG Engine Design
- **BAB 3.4.6**: Conversation Flow (Transactional Mode)
- **BAB 3.4.7**: API Design (RESTful)

## 🤝 Contributing

Untuk development lebih lanjut:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

[Sesuai dengan lisensi institusi]

## 👤 Author

**Robil** - Mahasiswa Teknik Informatika, Universitas Al-Azhar Indonesia

---

Untuk pertanyaan atau bantuan, silakan buat issue di repository ini.
