# YPI Al-Azhar Chatbot Backend V3

## 🎯 Overview

Backend service untuk chatbot pendaftaran siswa YPI Al-Azhar menggunakan **Dynamic JSON-based Form Configuration**.

**Key Features:**
- ✅ Dynamic form configuration (edit JSON, no code changes!)
- ✅ Context-aware conversations
- ✅ Flexible JSON data storage
- ✅ Skip functionality
- ✅ Conditional fields
- ✅ **API endpoints yang TIDAK mengganggu frontend existing**

---

## 📁 File Structure

```
backend_final/
├── main_v3.py                    # FastAPI application
├── form_config.py                # Form configuration system
├── form_config.json              # 👈 EDIT THIS to add/change fields!
├── dynamic_conversation_state.py # JSON-based state management
├── dynamic_form_handler.py       # Dynamic form handler
├── database.py                   # Database integration
├── llm_client.py                 # LLM API client
├── file_storage.py               # File upload handler
├── config.py                     # Configuration management
├── init_database.py              # Database initialization
├── requirements.txt              # Python dependencies
├── _env                          # Environment template
└── README.md                     # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp _env .env

# Edit .env file
nano .env
```

**Required settings:**
```env
# LLM Provider (choose one)
OPENAI_API_KEY=sk-your-api-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ypi_alazhar_db

# Optional
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
DEBUG=True
```

### 3. Initialize Database

```bash
python init_database.py
```

### 4. Run Server

```bash
python main_v3.py
```

Server will run on `http://localhost:8001` (port 8001 to avoid conflict with existing backend)

---

## 🔌 API Endpoints

### Base URL: `/api/v3/chatbot`

**PENTING:** Semua endpoints menggunakan prefix `/api/v3/chatbot` untuk **TIDAK mengganggu API existing**.

### Main Endpoints

#### 1. Health Check
```http
GET /api/v3/chatbot/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T10:00:00",
  "version": "3.0.0"
}
```

---

#### 2. Create Session
```http
POST /api/v3/chatbot/session/new
```

**Response:**
```json
{
  "session_id": "abc-123-def-456",
  "message": "Session created successfully",
  "current_section": "school_info",
  "timestamp": "2024-12-31T10:00:00"
}
```

---

#### 3. Send Chat Message ⭐ (Main Endpoint)
```http
POST /api/v3/chatbot/chat
Content-Type: application/json

{
  "session_id": "abc-123-def-456",
  "message": "Halo, nama saya Budi"
}
```

**Response:**
```json
{
  "session_id": "abc-123-def-456",
  "response": "Halo Pak Budi! Untuk anak yang mau didaftarkan, sekolah mana yang dituju?",
  "current_section": "school_info",
  "completion_percentage": 5.0,
  "metadata": {
    "messages_count": 2,
    "can_advance": false,
    "missing_fields": ["nama_sekolah", "program", "tingkatan"]
  }
}
```

---

#### 4. Get Session Info
```http
GET /api/v3/chatbot/session/{session_id}
```

**Response:**
```json
{
  "session_id": "abc-123",
  "current_section": "student_data",
  "completion_percentage": 35.0,
  "created_at": "2024-12-31T10:00:00",
  "updated_at": "2024-12-31T10:05:00",
  "collected_data": {
    "nama_lengkap": "Ahmad Fauzi",
    "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru",
    "tingkatan": "Playgroup"
  },
  "conversation_history": [...]
}
```

---

#### 5. Get Form Configuration
```http
GET /api/v3/chatbot/config
```

**Response:**
```json
{
  "form_name": "YPI Al-Azhar Student Registration",
  "version": "1.0",
  "sections": [
    {
      "name": "school_info",
      "label": "Informasi Sekolah",
      "required_fields": 2,
      "fields": [...]
    }
  ]
}
```

**Use case:** Frontend dapat render form dynamically based on config!

---

#### 6. Upload Document
```http
POST /api/v3/chatbot/upload/document
Content-Type: multipart/form-data

session_id: abc-123
field_name: akta_kelahiran
file: [binary data]
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "field_name": "akta_kelahiran",
  "file_path": "abc-123/akta_kelahiran_20241231_abc123.pdf"
}
```

---

#### 7. Get Summary
```http
GET /api/v3/chatbot/summary/{session_id}
```

**Response:**
```json
{
  "session_id": "abc-123",
  "completion_percentage": 75.0,
  "current_section": "parent_data",
  "collected_data": {...},
  "summary": {
    "student_name": "Ahmad Fauzi",
    "school": "TK Islam Al Azhar 1 Kebayoran Baru",
    "tingkatan": "Playgroup",
    "program": "Reguler"
  }
}
```

---

#### 8. Confirm Registration
```http
POST /api/v3/chatbot/confirm/{session_id}
```

**Response:**
```json
{
  "success": true,
  "registration_number": "AZHAR-2024-TK-ABC12345",
  "message": "Registration confirmed successfully!",
  "next_steps": [
    "Complete payment for registration fee",
    "Wait for document verification (1-3 business days)",
    "You will receive confirmation email"
  ]
}
```

---

#### 9. Check Status
```http
GET /api/v3/chatbot/status/{registration_number}
```

**Response:**
```json
{
  "registration_number": "AZHAR-2024-TK-ABC12345",
  "status": "submitted",
  "last_updated": "2024-12-31T10:00:00",
  "student_data": {...},
  "tracking_history": [...]
}
```

---

### Debug Endpoints (Development Only)

#### Debug Session
```http
GET /api/v3/chatbot/debug/session/{session_id}
```

#### Debug Config
```http
GET /api/v3/chatbot/debug/config
```

---

## 🎨 Frontend Integration

### Example: React/Next.js

```typescript
// services/chatbot.ts

const API_BASE = 'http://localhost:8001/api/v3/chatbot';

export const chatbotService = {
  // Create new session
  createSession: async () => {
    const res = await fetch(`${API_BASE}/session/new`, {
      method: 'POST'
    });
    return res.json();
  },

  // Send message
  sendMessage: async (sessionId: string, message: string) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message })
    });
    return res.json();
  },

  // Get session info
  getSession: async (sessionId: string) => {
    const res = await fetch(`${API_BASE}/session/${sessionId}`);
    return res.json();
  },

  // Upload document
  uploadDocument: async (sessionId: string, fieldName: string, file: File) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('field_name', fieldName);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload/document`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // Confirm registration
  confirmRegistration: async (sessionId: string) => {
    const res = await fetch(`${API_BASE}/confirm/${sessionId}`, {
      method: 'POST'
    });
    return res.json();
  }
};
```

### Example: Chat Component

```tsx
import { useState, useEffect } from 'react';
import { chatbotService } from '@/services/chatbot';

export default function ChatBot() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Create session on mount
    chatbotService.createSession().then(data => {
      setSessionId(data.session_id);
    });
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    // Send to API
    const response = await chatbotService.sendMessage(sessionId, input);

    // Add bot response
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: response.response 
    }]);

    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        placeholder="Ketik pesan..."
      />
    </div>
  );
}
```

---

## 🔧 Configuration Management

### Add New Field

Edit `form_config.json`:

```json
{
  "sections": [
    {
      "name": "student_data",
      "fields": [
        // ... existing fields ...
        
        // ADD NEW FIELD:
        {
          "name": "hobi",
          "label": "Hobi Anak",
          "type": "text",
          "required": false,
          "skippable": true,
          "help_text": "Sebutkan hobi atau minat anak"
        }
      ]
    }
  ]
}
```

**Restart server** → Field automatically handled! ✅

### Add New Section

```json
{
  "sections": [
    // ... existing sections ...
    
    // ADD NEW SECTION:
    {
      "name": "health_data",
      "label": "Data Kesehatan",
      "description": "Informasi kesehatan anak",
      "required_fields": 1,
      "skippable": true,
      "fields": [
        {
          "name": "golongan_darah",
          "label": "Golongan Darah",
          "type": "select",
          "options": ["A", "B", "AB", "O"],
          "required": true,
          "skippable": false
        }
      ]
    }
  ]
}
```

---

## 🗄️ Database

### Schema

```sql
-- Main registration table
CREATE TABLE student_registrations (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE,
    student_data JSON,
    parent_data JSON,
    academic_data JSON,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation state (for resume)
CREATE TABLE conversation_state (
    session_id VARCHAR(100) PRIMARY KEY,
    current_step VARCHAR(50),
    collected_data JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation history
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    user_message TEXT,
    bot_response TEXT,
    intent VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Query Examples

```sql
-- Get student name
SELECT student_data->>'nama_lengkap' as name
FROM student_registrations;

-- Filter by school
SELECT * FROM student_registrations
WHERE student_data->>'nama_sekolah' LIKE '%Kebayoran%';

-- Get all data for session
SELECT collected_data 
FROM conversation_state 
WHERE session_id = 'abc-123';
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Create session
curl -X POST http://localhost:8001/api/v3/chatbot/session/new

# 2. Send message
curl -X POST http://localhost:8001/api/v3/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message": "Halo, nama saya Budi"
  }'

# 3. Get session info
curl http://localhost:8001/api/v3/chatbot/session/your-session-id

# 4. Confirm registration
curl -X POST http://localhost:8001/api/v3/chatbot/confirm/your-session-id
```

### Using Postman/Insomnia

Import endpoints:
- Base URL: `http://localhost:8001`
- Prefix: `/api/v3/chatbot`

---

## 📊 API Versioning

### Why `/api/v3/chatbot`?

- **Isolation**: Tidak mengganggu API existing
- **Versioning**: Easy to maintain multiple versions
- **Clear namespace**: Frontend tahu ini API chatbot V3

### Migration from Existing API

Frontend yang existing tetap bisa pakai API lama:
- Old API: `/api/...` → Tetap jalan
- New API: `/api/v3/chatbot/...` → Backend baru

Migrasi bertahap:
1. Deploy backend V3 di port berbeda (8001)
2. Test dengan frontend baru
3. Gradually migrate frontend
4. Retire old API when ready

---

## 🔐 Security Notes

### Production Checklist

- [ ] Change `SECRET_KEY` in config
- [ ] Set proper CORS origins (not `*`)
- [ ] Use HTTPS
- [ ] Rate limiting
- [ ] Input validation
- [ ] File upload restrictions
- [ ] Database connection pooling
- [ ] Environment variables properly set

---

## 📈 Performance

### Optimization Tips

1. **Database Connection Pool**
```python
# config.py
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 10
```

2. **Caching**
```python
# Cache form config in memory
@lru_cache()
def get_form_config():
    # ...
```

3. **Async Processing**
```python
# Already using async/await for LLM calls
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Change port in main_v3.py
uvicorn.run(app, port=8002)  # Use different port
```

**2. Database connection failed**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo service postgresql start
```

**3. LLM API error**
```bash
# Check API key in .env
# Verify key is valid
echo $OPENAI_API_KEY
```

**4. CORS error from frontend**
```python
# Update CORS origins in main_v3.py
allow_origins=["http://localhost:3000"]  # Your FE URL
```

---

## 📚 Documentation

- API Docs (Swagger): `http://localhost:8001/api/v3/chatbot/docs`
- ReDoc: `http://localhost:8001/api/v3/chatbot/redoc`

---

## 🎯 Summary

### Key Points

1. **API Prefix**: `/api/v3/chatbot` - tidak ganggu API existing ✅
2. **Port**: Default 8001 - avoid conflict ✅
3. **Dynamic Config**: Edit `form_config.json` only ✅
4. **JSON Storage**: Flexible data structure ✅
5. **Context-Aware**: Remember conversation history ✅

### Next Steps

1. ✅ Configure `.env`
2. ✅ Initialize database
3. ✅ Run server
4. ✅ Test endpoints
5. ✅ Integrate with frontend
6. ✅ Deploy to production

---

**Version**: 3.0.0  
**Port**: 8001 (configurable)  
**API Prefix**: `/api/v3/chatbot`  
**Status**: Production Ready ✅
