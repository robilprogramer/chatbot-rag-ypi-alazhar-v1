# YPI Al-Azhar Chatbot Frontend

Frontend aplikasi chatbot interaktif untuk pendaftaran siswa baru YPI Al-Azhar Jakarta. Dibangun dengan Next.js 14, TypeScript, dan Tailwind CSS.

## 🎨 Fitur UI/UX

### ✨ Interaktif & Modern
- **Real-time chat interface** dengan bubble chat yang responsif
- **Typing indicator** untuk menunjukkan bot sedang memproses
- **Smooth animations** menggunakan Framer Motion
- **Progress bar** visual untuk tracking tahapan pendaftaran
- **Drag & drop file upload** dengan validasi otomatis
- **Responsive design** untuk mobile, tablet, dan desktop

### 🎯 User-Friendly
- **Auto-scroll** ke pesan terbaru
- **Session persistence** - chat tidak hilang saat refresh
- **Real-time progress tracking** dengan persentase completion
- **Visual step indicators** untuk menunjukkan posisi dalam alur pendaftaran
- **Error handling** yang informatif

### 🎨 Design System
- **Tailwind CSS** untuk styling yang konsisten
- **Gradient colors** (Blue to Emerald) sesuai branding Al-Azhar
- **Custom animations** untuk transisi yang smooth
- **Accessible components** dengan proper ARIA labels

## 📁 Struktur Proyek

```
chatbot-frontend/
├── app/
│   ├── globals.css              # Global styles & Tailwind
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── components/
│   ├── ChatInterface.tsx        # Main chat component
│   ├── ChatMessage.tsx          # Message bubble component
│   ├── TypingIndicator.tsx      # Typing animation
│   ├── ProgressBar.tsx          # Registration progress
│   └── FileUpload.tsx           # Drag & drop upload
├── lib/
│   ├── api.ts                   # API client
│   └── utils.ts                 # Utility functions
├── types/
│   └── index.ts                 # TypeScript definitions
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Backend API running di http://localhost:8000

### Installation

1. **Install dependencies**
```bash
npm install
# atau
yarn install
```

2. **Setup environment**
```bash
cp .env.local.example .env.local
# Edit .env.local dengan API URL Anda
```

3. **Run development server**
```bash
npm run dev
# atau
yarn dev
```

4. **Open browser**
```
http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Customization

#### Colors (tailwind.config.js)
```javascript
colors: {
  alazhar: {
    primary: '#2563eb',    // Biru utama
    secondary: '#059669',  // Hijau
    accent: '#f59e0b',     // Aksen
  }
}
```

#### API Endpoint (lib/api.ts)
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

### Layout Adaptations
- Stack vertically di mobile
- 2 columns untuk file upload di tablet
- Full grid layout di desktop
- Progress bar adaptif (2-3-6 columns)

## 🎯 Component Documentation

### ChatInterface
Main component yang menghandle seluruh chat logic.

**Features:**
- Session management
- Message state management
- Real-time updates
- File upload handling
- Progress tracking

### ChatMessage
Displays individual chat messages with styling.

**Props:**
```typescript
interface ChatMessageProps {
  message: Message;
}
```

### ProgressBar
Visual progress indicator untuk registration flow.

**Props:**
```typescript
interface ProgressBarProps {
  currentStep: string;
  completionPercentage: number;
}
```

### FileUpload
Drag & drop file upload dengan validasi.

**Props:**
```typescript
interface FileUploadProps {
  documentType: string;
  onUpload: (file: File) => Promise<void>;
  label: string;
  description?: string;
}
```

## 🔌 API Integration

### Endpoints Used

```typescript
// Send chat message
POST /api/chat
{
  "message": "string",
  "session_id": "string" 
}

// Upload document
POST /api/upload/document
FormData: {
  session_id, 
  document_type,
  file
}

// Get session info
GET /api/session/{session_id}

// Create new session
POST /api/session/new
```

## 💾 Local Storage

Data yang disimpan di localStorage:
- `chatbot_session_id`: Session ID aktif
- `chatbot_messages`: History pesan (untuk persistance)

## 🎨 Animations & Transitions

### Built-in Animations
```css
.chat-bubble-enter     /* Slide up animation */
.typing-dot           /* Typing indicator bounce */
.gradient-text        /* Gradient text effect */
```

### Custom Animations (Tailwind)
```javascript
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
}
```

## 🧪 Development

### Linting
```bash
npm run lint
```

### Build Production
```bash
npm run build
npm run start
```

### Type Checking
```bash
npx tsc --noEmit
```

## 📦 Dependencies

### Core
- **next**: 14.0.4 - React framework
- **react**: 18.2.0
- **typescript**: 5.3.3

### UI/UX
- **tailwindcss**: 3.4.0 - Styling
- **framer-motion**: 10.18.0 - Animations
- **lucide-react**: 0.303.0 - Icons
- **react-markdown**: 9.0.1 - Markdown rendering

### Utilities
- **axios**: 1.6.5 - HTTP client
- **react-dropzone**: 14.2.3 - File upload
- **date-fns**: 3.0.6 - Date formatting
- **clsx**: 2.1.0 - Class management

## 🎯 Best Practices

### State Management
```typescript
// Use proper state types
const [messages, setMessages] = useState<Message[]>([]);

// Save to localStorage for persistence
saveToLocalStorage('key', data);
```

### Error Handling
```typescript
try {
  await api.call();
} catch (error: any) {
  // Show user-friendly error
  console.error('Error:', error);
}
```

### Accessibility
```typescript
// Use semantic HTML
<button aria-label="Send message">
  <Send className="w-5 h-5" />
</button>
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security

- Environment variables tidak di-commit
- Input validation di client & server
- File upload validation (type, size)
- XSS protection dengan React
- CORS configuration di backend

## 📊 Performance

- **Code splitting** otomatis dengan Next.js
- **Image optimization** dengan next/image
- **Lazy loading** untuk components berat
- **Memoization** untuk expensive computations

## 🐛 Troubleshooting

### API Connection Error
```
Pastikan backend running di port yang benar
Check NEXT_PUBLIC_API_URL di .env.local
```

### Build Error
```bash
# Clear cache
rm -rf .next
npm install
npm run build
```

### TypeScript Errors
```bash
# Regenerate types
npx tsc --noEmit
```

## 📝 Sesuai dengan Skripsi

Implementasi frontend ini mengikuti:
- **BAB 3.4.8**: Perancangan Antarmuka Pengguna
- **BAB 3.4.6**: Conversation Flow (Mode Transactional)
- **BAB 3.3.3**: Kebutuhan Fungsional (UI interaktif)

## 🤝 Contributing

Untuk development lebih lanjut:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push dan create PR

## 👤 Author

**Robil** - Mahasiswa Teknik Informatika UAI
NIM: 0102524719

---

💡 **Tips**: Gunakan browser modern (Chrome, Firefox, Safari) untuk pengalaman terbaik!
