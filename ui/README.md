# 📚 Knowledge Base Admin
## YPI Al-Azhar - Frontend Management System

Next.js + Tailwind CSS frontend untuk Knowledge Base Management System.

---

## 🖼️ Screenshots

### Dashboard
- Overview statistics
- Quick actions
- Knowledge breakdown by jenjang/kategori

### Upload
- Drag & drop PDF upload
- Metadata form (tahun, jenjang, kategori, cabang)
- Auto-parse option
- Skip review option for full pipeline

### Staging / Review
- Split view: list + detail
- Edit parsed content before approve
- Approve/Reject individual or all
- Side-by-side original vs edited

### Processing
- Visual pipeline (Process → Embed → Complete)
- Document selection
- Chunk size/overlap configuration
- Process single or all documents

### Knowledge Base
- Search & filter
- Grid view of entries
- Add manual knowledge
- View detail modal

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
kb-admin-frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard
│   ├── globals.css         # Global styles
│   ├── upload/
│   │   └── page.tsx        # Upload page
│   ├── documents/
│   │   └── page.tsx        # Documents list
│   ├── staging/
│   │   └── page.tsx        # Staging/Review
│   ├── processing/
│   │   └── page.tsx        # Processing page
│   └── knowledge/
│       └── page.tsx        # Knowledge base
├── components/
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/
│   ├── api.ts              # API client
│   ├── store.ts            # Zustand store
│   └── constants.ts        # Constants
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## 🔄 Workflow

### 1. Upload Document
1. Go to **Upload**
2. Drag & drop or select PDF
3. Fill metadata (jenjang, kategori, tahun)
4. Choose:
   - **Upload & Review** (recommended) → Goes to Staging
   - **Upload & Process** (skip review) → Full pipeline

### 2. Review & Edit (Staging)
1. Go to **Staging**
2. Select document or view all
3. Click content to view detail
4. Click **Edit** to modify content
5. Fix any parsing errors
6. Click **Approve** when ready

### 3. Process
1. Go to **Processing**
2. Select document with approved content
3. Configure chunk size (optional)
4. Click **Process** to chunk and embed

### 4. Manage Knowledge
1. Go to **Knowledge Base**
2. Search and filter entries
3. Add manual knowledge
4. View/Delete entries

---

## 🎨 UI Components

### Custom Buttons
```jsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-success">Success</button>
<button className="btn-danger">Danger</button>
```

### Cards
```jsx
<div className="card">
  Content here
</div>
```

### Badges
```jsx
<span className="badge badge-green">Active</span>
<span className="badge badge-yellow">Pending</span>
<span className="badge badge-red">Error</span>
<span className="badge badge-blue">Info</span>
```

### Form Elements
```jsx
<input className="input-field" />
<select className="select-field">...</select>
```

---

## 🔌 API Integration

All API calls are in `lib/api.ts`:

```typescript
// Documents
documentApi.upload(file, metadata)
documentApi.list(params)
documentApi.parse(id)
documentApi.delete(id)

// Staging
stagingApi.list(params)
stagingApi.edit(id, data)
stagingApi.approve(id)
stagingApi.reject(id)
stagingApi.approveAll(documentId)

// Processing
processingApi.process(documentId, chunkSize, overlap)
processingApi.embed(entryId, batchSize)

// Knowledge
knowledgeApi.list(params)
knowledgeApi.addManual(data)
knowledgeApi.update(id, data)
knowledgeApi.delete(id)

// Stats
statsApi.get()

// Full Pipeline
pipelineApi.runFull(file, metadata, skipReview)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Language**: TypeScript

---

## 📝 License

MIT License - YPI Al-Azhar
