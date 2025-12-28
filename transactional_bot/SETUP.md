# 🚀 Production Setup Guide

## Backend Sekarang Sudah Production-Ready! ✅

### ✅ Yang Sudah Diimplementasi (Bukan Simulasi Lagi):

1. **✅ LLM Client** - Real integration dengan OpenAI/Anthropic
2. **✅ Database Operations** - Full CRUD dengan PostgreSQL
3. **✅ File Storage** - Actual file upload & storage
4. **✅ Session Management** - Persistent state di database
5. **✅ Conversation History** - Tersimpan di database
6. **✅ Registration System** - Complete flow dengan database

### 🔒 Database Safety:

- ✅ **AMAN**: `create_tables()` hanya create table yang belum ada
- ✅ **TIDAK akan drop existing tables** secara otomatis
- ⚠️ `drop_tables()` butuh konfirmasi eksplisit
- ✅ Gunakan `init_database.py` untuk setup yang aman

---

## 📋 Prerequisites

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Download dari: https://www.postgresql.org/download/windows/
```

### 2. Create Database
```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database
CREATE DATABASE ypi_alazhar;

# Buat user (optional)
CREATE USER alazhar_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ypi_alazhar TO alazhar_admin;

# Exit
\q
```

### 3. Get API Keys

**OpenAI:**
1. Go to: https://platform.openai.com/api-keys
2. Create new API key
3. Copy key (starts with `sk-...`)

**Atau Anthropic Claude:**
1. Go to: https://console.anthropic.com/
2. Create API key
3. Copy key (starts with `sk-ant-...`)

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd transactional_bot
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env dengan editor favorit
nano .env  # atau vim, code, dll
```

**Minimal Configuration (.env):**
```env
# Database - WAJIB!
DATABASE_URL=postgresql://postgres:password@localhost:5432/ypi_alazhar

# LLM Provider - Pilih salah satu
LLM_PROVIDER=openai

# OpenAI (jika pakai OpenAI)
OPENAI_API_KEY=sk-your-actual-openai-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# ATAU Anthropic (jika pakai Claude)
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
# ANTHROPIC_MODEL=claude-3-sonnet-20240229

# File Upload
UPLOAD_DIR=./uploads
```

### 3. Initialize Database (SAFE!)
```bash
# Cara AMAN - hanya create missing tables
python init_database.py

# Dengan sample data untuk testing
python init_database.py --sample-data

# BAHAYA - Drop semua tables (jangan gunakan jika sudah ada data!)
# python init_database.py --force
```

**Output yang diharapkan:**
```
============================================================
YPI Al-Azhar Database Initialization
============================================================
Database URL: postgresql://...

📊 Creating database tables...

✅ Database initialization complete!
📋 Tables created: 7
   - document_chunks
   - document_embeddings
   - student_registrations
   - registration_documents
   - registration_tracking
   - conversations
   - conversation_state

============================================================
```

### 4. Run Server
```bash
# Development mode
python main.py

# Atau dengan uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Server should start:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 5. Test API
```bash
# Health check
curl http://localhost:8000/

# Create session
curl -X POST http://localhost:8000/api/session/new

# Send message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, saya ingin mendaftarkan anak saya"
  }'
```

---

## 🔍 Verification Checklist

### ✅ Database Check
```bash
# Login ke PostgreSQL
psql -U postgres -d ypi_alazhar

# List tables
\dt

# Check sample data
SELECT * FROM student_registrations;

# Exit
\q
```

### ✅ LLM Check
Jika error "API key not found":
- Cek file `.env` ada dan benar
- Pastikan `OPENAI_API_KEY` atau `ANTHROPIC_API_KEY` terisi
- Restart server setelah edit `.env`

### ✅ File Upload Check
```bash
# Folder upload harus ada
ls -la ./uploads

# Jika belum ada
mkdir -p ./uploads
```

---

## 🗄️ Database Schema

Tables yang dibuat:

1. **student_registrations** - Data pendaftaran siswa
2. **registration_documents** - Dokumen yang diupload
3. **registration_tracking** - History tracking status
4. **conversations** - Riwayat chat
5. **conversation_state** - State untuk resume session
6. **document_chunks** - (untuk RAG - future)
7. **document_embeddings** - (untuk RAG - future)

---

## 🔒 Security Notes

### Database
- ✅ Gunakan password yang kuat
- ✅ Jangan commit `.env` ke git
- ✅ Restrict database access di production

### API Keys
- ✅ Simpan di `.env`, jangan hardcode
- ✅ Monitor usage di dashboard provider
- ✅ Set rate limits jika perlu

### File Uploads
- ✅ Validasi type & size sudah ada
- ✅ Generate unique filenames ✓
- ✅ Store outside web root ✓

---

## 📊 Monitoring

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('ypi_alazhar'));
```

### Active Sessions
```sql
SELECT COUNT(*) FROM conversation_state WHERE updated_at > NOW() - INTERVAL '1 hour';
```

### Registration Stats
```sql
SELECT status, COUNT(*) FROM student_registrations GROUP BY status;
```

---

## 🐛 Troubleshooting

### Error: "could not connect to server"
```bash
# Check PostgreSQL running
sudo service postgresql status

# Start if not running
sudo service postgresql start
```

### Error: "relation does not exist"
```bash
# Re-initialize database
python init_database.py
```

### Error: "API key not found"
```bash
# Check .env file
cat .env | grep API_KEY

# Make sure no spaces around =
# CORRECT: OPENAI_API_KEY=sk-xxx
# WRONG:   OPENAI_API_KEY = sk-xxx
```

### Error: "Permission denied: ./uploads"
```bash
# Fix permissions
chmod 755 ./uploads
```

---

## 🚀 Production Deployment

### 1. Use Production Database
```env
DATABASE_URL=postgresql://user:password@production-host:5432/ypi_alazhar
```

### 2. Use Production WSGI Server
```bash
# Install gunicorn
pip install gunicorn

# Run
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.ypi-alazhar.id;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Setup SSL
```bash
# Using Let's Encrypt
sudo certbot --nginx -d api.ypi-alazhar.id
```

### 5. Environment Variables
```bash
# Never commit .env to git!
echo ".env" >> .gitignore

# Use environment-specific configs
# .env.development
# .env.staging  
# .env.production
```

---

## 📈 Next Steps

1. ✅ **Backend siap production**
2. 🔄 **Implement RAG Engine** untuk mode informasional
3. 🔄 **Add email notifications**
4. 🔄 **Add payment gateway integration**
5. 🔄 **Setup admin dashboard**
6. 🔄 **Add analytics & reporting**

---

## 💡 Important Notes

### Database Safety
```python
# ✅ AMAN - Hanya create missing tables
db.create_tables()

# ⚠️ BAHAYA - Akan drop SEMUA data!
# db.drop_tables()  # JANGAN PANGGIL INI di production!
```

### Migration Strategy
Jika perlu update schema:
1. Gunakan Alembic untuk migrations
2. Backup database sebelum migrate
3. Test di staging dulu

### Backup Database
```bash
# Backup
pg_dump -U postgres ypi_alazhar > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres ypi_alazhar < backup_20250126.sql
```

---

## 🎉 Summary

Backend sekarang **PRODUCTION-READY** dengan:
- ✅ Real LLM integration (OpenAI/Anthropic)
- ✅ PostgreSQL database (SAFE - tidak auto-drop)
- ✅ Actual file storage
- ✅ Complete CRUD operations
- ✅ Session persistence
- ✅ Conversation history
- ✅ Registration workflow

**TIDAK ADA LAGI TODO untuk core functionality!**

---

Untuk pertanyaan lebih lanjut, lihat `README.md` atau buat issue di repository.
