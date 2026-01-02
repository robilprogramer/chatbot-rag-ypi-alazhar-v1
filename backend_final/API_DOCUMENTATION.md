# API Documentation for Frontend Integration

## 🎯 Overview

API untuk chatbot pendaftaran siswa YPI Al-Azhar V3.

**Base URL**: `http://localhost:8001/api/v3/chatbot` (development)  
**Base URL**: `https://api.yourdomain.com/api/v3/chatbot` (production)

**PENTING**: Semua endpoint menggunakan prefix `/api/v3/chatbot` untuk **TIDAK mengganggu API existing**.

---

## 🔑 Key Concepts

### Session Management

1. Create session → Get `session_id`
2. Use `session_id` for all subsequent requests
3. Session stores conversation history and collected data
4. Session persists until confirmed or deleted

### Conversation Flow

```
Create Session
    ↓
Send Messages (multiple turns)
    ↓
Upload Documents (optional)
    ↓
Review Summary
    ↓
Confirm Registration
```

---

## 📚 API Endpoints

### 1. Create New Session

Create a new chat session for registration.

**Endpoint**: `POST /session/new`

**Request**:
```http
POST /api/v3/chatbot/session/new
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session created successfully",
  "current_section": "school_info",
  "timestamp": "2024-12-31T10:00:00.000Z"
}
```

**TypeScript**:
```typescript
interface CreateSessionResponse {
  session_id: string;
  message: string;
  current_section: string;
  timestamp: string;
}

const createSession = async (): Promise<CreateSessionResponse> => {
  const response = await fetch(`${API_BASE}/session/new`, {
    method: 'POST'
  });
  return response.json();
};
```

---

### 2. Send Chat Message ⭐

Send a message in the conversation.

**Endpoint**: `POST /chat`

**Request**:
```http
POST /api/v3/chatbot/chat
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Halo, nama saya Budi"
}
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
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

**TypeScript**:
```typescript
interface ChatRequest {
  session_id: string;
  message: string;
}

interface ChatResponse {
  session_id: string;
  response: string;
  current_section: string;
  completion_percentage: number;
  metadata: {
    messages_count: number;
    can_advance: boolean;
    missing_fields: string[];
  };
}

const sendMessage = async (
  sessionId: string, 
  message: string
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message })
  });
  return response.json();
};
```

---

### 3. Get Session Information

Retrieve current session state.

**Endpoint**: `GET /session/{session_id}`

**Request**:
```http
GET /api/v3/chatbot/session/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_section": "student_data",
  "completion_percentage": 35.0,
  "created_at": "2024-12-31T10:00:00.000Z",
  "updated_at": "2024-12-31T10:05:00.000Z",
  "collected_data": {
    "nama_lengkap": "Ahmad Fauzi",
    "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru",
    "tingkatan": "Playgroup",
    "program": "Reguler"
  },
  "conversation_history": [
    {
      "role": "user",
      "content": "Halo",
      "timestamp": "2024-12-31T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Halo! Untuk sekolah mana yang dituju?",
      "timestamp": "2024-12-31T10:00:01.000Z"
    }
  ]
}
```

**TypeScript**:
```typescript
interface SessionInfo {
  session_id: string;
  current_section: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  collected_data: Record<string, any>;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

const getSession = async (sessionId: string): Promise<SessionInfo> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}`);
  return response.json();
};
```

---

### 4. Get Form Configuration

Get dynamic form configuration (sections and fields).

**Endpoint**: `GET /config`

**Request**:
```http
GET /api/v3/chatbot/config
```

**Response**:
```json
{
  "form_name": "YPI Al-Azhar Student Registration",
  "version": "1.0",
  "sections": [
    {
      "name": "school_info",
      "label": "Informasi Sekolah",
      "description": "Pilihan sekolah dan program",
      "required_fields": 2,
      "skippable": false,
      "fields": [
        {
          "name": "nama_sekolah",
          "label": "Nama Sekolah",
          "type": "select",
          "required": true,
          "skippable": false,
          "options": [
            "TK Islam Al Azhar 1 Kebayoran Baru",
            "SD Islam Al Azhar 1 Kebayoran Baru"
          ],
          "help_text": "Pilih unit sekolah yang dituju"
        }
      ]
    }
  ]
}
```

**TypeScript**:
```typescript
interface Field {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'phone' | 'email' | 'textarea' | 'file';
  required: boolean;
  skippable: boolean;
  options?: string[];
  help_text?: string;
  placeholder?: string;
  validation_pattern?: string;
  depends_on?: Record<string, string[]>;
}

interface Section {
  name: string;
  label: string;
  description?: string;
  required_fields: number;
  skippable: boolean;
  fields: Field[];
}

interface FormConfig {
  form_name: string;
  version: string;
  sections: Section[];
}

const getFormConfig = async (): Promise<FormConfig> => {
  const response = await fetch(`${API_BASE}/config`);
  return response.json();
};
```

**Use Case**: Render dynamic form UI based on configuration!

---

### 5. Upload Document

Upload a document file.

**Endpoint**: `POST /upload/document`

**Request**:
```http
POST /api/v3/chatbot/upload/document
Content-Type: multipart/form-data

session_id: 550e8400-e29b-41d4-a716-446655440000
field_name: akta_kelahiran
file: [binary data]
```

**Response**:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "field_name": "akta_kelahiran",
  "file_path": "550e8400/akta_kelahiran_20241231_abc123.pdf"
}
```

**TypeScript**:
```typescript
interface UploadResponse {
  success: boolean;
  message: string;
  field_name: string;
  file_path: string;
}

const uploadDocument = async (
  sessionId: string,
  fieldName: string,
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('field_name', fieldName);
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/document`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

---

### 6. Get Registration Summary

Get summary of collected data.

**Endpoint**: `GET /summary/{session_id}`

**Request**:
```http
GET /api/v3/chatbot/summary/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "completion_percentage": 75.0,
  "current_section": "parent_data",
  "collected_data": {
    "nama_lengkap": "Ahmad Fauzi",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "15/05/2018",
    "jenis_kelamin": "Laki-laki",
    "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru",
    "program": "Reguler",
    "tingkatan": "Playgroup"
  },
  "summary": {
    "student_name": "Ahmad Fauzi",
    "school": "TK Islam Al Azhar 1 Kebayoran Baru",
    "tingkatan": "Playgroup",
    "program": "Reguler"
  },
  "timestamp": "2024-12-31T10:30:00.000Z"
}
```

---

### 7. Confirm Registration

Finalize and confirm registration.

**Endpoint**: `POST /confirm/{session_id}`

**Request**:
```http
POST /api/v3/chatbot/confirm/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "success": true,
  "registration_number": "AZHAR-2024-TK-ABC12345",
  "message": "Registration confirmed successfully!",
  "next_steps": [
    "Complete payment for registration fee",
    "Wait for document verification (1-3 business days)",
    "You will receive confirmation email"
  ],
  "timestamp": "2024-12-31T10:35:00.000Z"
}
```

**TypeScript**:
```typescript
interface ConfirmResponse {
  success: boolean;
  registration_number: string;
  message: string;
  next_steps: string[];
  timestamp: string;
}

const confirmRegistration = async (
  sessionId: string
): Promise<ConfirmResponse> => {
  const response = await fetch(`${API_BASE}/confirm/${sessionId}`, {
    method: 'POST'
  });
  return response.json();
};
```

---

### 8. Check Registration Status

Check status of confirmed registration.

**Endpoint**: `GET /status/{registration_number}`

**Request**:
```http
GET /api/v3/chatbot/status/AZHAR-2024-TK-ABC12345
```

**Response**:
```json
{
  "registration_number": "AZHAR-2024-TK-ABC12345",
  "status": "submitted",
  "last_updated": "2024-12-31T10:35:00.000Z",
  "student_data": {
    "nama_lengkap": "Ahmad Fauzi",
    "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru"
  },
  "tracking_history": [
    {
      "status": "submitted",
      "notes": "Registration confirmed via chatbot V3",
      "created_at": "2024-12-31T10:35:00.000Z"
    }
  ]
}
```

---

## 🎨 React/Next.js Integration Example

### Complete Service File

```typescript
// services/chatbot.ts

const API_BASE = process.env.NEXT_PUBLIC_CHATBOT_API || 
                 'http://localhost:8001/api/v3/chatbot';

export class ChatbotService {
  async createSession() {
    const res = await fetch(`${API_BASE}/session/new`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  }

  async sendMessage(sessionId: string, message: string) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  }

  async getSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/session/${sessionId}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  }

  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to get config');
    return res.json();
  }

  async uploadDocument(sessionId: string, fieldName: string, file: File) {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('field_name', fieldName);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload/document`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }

  async getSummary(sessionId: string) {
    const res = await fetch(`${API_BASE}/summary/${sessionId}`);
    if (!res.ok) throw new Error('Failed to get summary');
    return res.json();
  }

  async confirmRegistration(sessionId: string) {
    const res = await fetch(`${API_BASE}/confirm/${sessionId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Confirmation failed');
    return res.json();
  }

  async getStatus(registrationNumber: string) {
    const res = await fetch(`${API_BASE}/status/${registrationNumber}`);
    if (!res.ok) throw new Error('Status not found');
    return res.json();
  }
}

export const chatbotService = new ChatbotService();
```

### Chat Component Example

```tsx
// components/ChatBot.tsx
import { useState, useEffect } from 'react';
import { chatbotService } from '@/services/chatbot';

export default function ChatBot() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    // Initialize session
    chatbotService.createSession().then(data => {
      setSessionId(data.session_id);
      setMessages([{
        role: 'assistant',
        content: 'Halo! Saya akan membantu proses pendaftaran. Untuk sekolah mana yang dituju?'
      }]);
    });
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(sessionId, input);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response 
      }]);
      
      setCompletion(response.completion_percentage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="header">
        <h2>Pendaftaran Siswa Baru</h2>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${completion}%` }} />
          <span>{completion.toFixed(0)}% Complete</span>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}
        {loading && <div className="typing-indicator">...</div>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ketik pesan..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Kirim
        </button>
      </div>
    </div>
  );
}
```

---

## 🔒 Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (session/registration not found)
- `500` - Server Error

**Error Response Format**:
```json
{
  "detail": "Error message here"
}
```

**Example Error Handling**:
```typescript
try {
  const response = await chatbotService.sendMessage(sessionId, message);
} catch (error) {
  if (error.response?.status === 404) {
    // Session not found - create new one
  } else if (error.response?.status === 500) {
    // Server error - show error message
  }
}
```

---

## 📱 WebSocket Support (Future)

Currently using REST API. WebSocket support planned for real-time updates.

---

## ✅ Best Practices

1. **Store session_id** in localStorage/sessionStorage
2. **Handle errors gracefully** - show user-friendly messages
3. **Show loading states** - improve UX
4. **Validate input** before sending (optional, backend also validates)
5. **Implement retry logic** for failed requests
6. **Clear session** after confirmation
7. **Use TypeScript** for type safety

---

**API Documentation Version**: 1.0  
**Last Updated**: December 2024  
**Base URL**: `/api/v3/chatbot`
