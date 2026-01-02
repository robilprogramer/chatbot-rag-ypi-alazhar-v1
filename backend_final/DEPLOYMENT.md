# Deployment Guide - YPI Al-Azhar Chatbot Backend V3

## 🚀 Production Deployment

### Prerequisites

- Ubuntu/Debian server
- PostgreSQL 12+
- Python 3.9+
- Nginx (optional, for reverse proxy)
- Domain name (optional)

---

## 📦 Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+
sudo apt install python3.9 python3.9-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (optional)
sudo apt install nginx -y
```

---

### 2. Database Setup

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ypi_alazhar_db;
CREATE USER ypi_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ypi_alazhar_db TO ypi_user;
\q
```

---

### 3. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/ypi-chatbot
cd /var/www/ypi-chatbot

# Upload files (use scp, git, or other method)
# scp -r backend_final/* user@server:/var/www/ypi-chatbot/

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

**`.env` file:**
```env
# LLM
OPENAI_API_KEY=sk-your-production-api-key
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Database
DATABASE_URL=postgresql://ypi_user:your_secure_password@localhost:5432/ypi_alazhar_db

# Application
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-change-this
API_HOST=0.0.0.0
API_PORT=8001

# CORS
CORS_ORIGINS=["https://yourdomain.com"]

# Logging
LOG_LEVEL=INFO
```

---

### 4. Initialize Database

```bash
# Activate venv
source venv/bin/activate

# Initialize database
python init_database.py

# Verify tables created
sudo -u postgres psql ypi_alazhar_db -c "\dt"
```

---

### 5. Test Application

```bash
# Test run
python main_v3.py

# Test endpoint
curl http://localhost:8001/api/v3/chatbot/health
```

If successful, proceed to systemd setup.

---

### 6. Systemd Service

Create systemd service file:

```bash
sudo nano /etc/systemd/system/ypi-chatbot.service
```

**Service file:**
```ini
[Unit]
Description=YPI Al-Azhar Chatbot Backend V3
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/ypi-chatbot
Environment="PATH=/var/www/ypi-chatbot/venv/bin"
ExecStart=/var/www/ypi-chatbot/venv/bin/python main_v3.py
Restart=always
RestartSec=10

# Logging
StandardOutput=append:/var/log/ypi-chatbot/output.log
StandardError=append:/var/log/ypi-chatbot/error.log

[Install]
WantedBy=multi-user.target
```

**Setup logging directory:**
```bash
sudo mkdir -p /var/log/ypi-chatbot
sudo chown www-data:www-data /var/log/ypi-chatbot
```

**Start service:**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start ypi-chatbot

# Enable on boot
sudo systemctl enable ypi-chatbot

# Check status
sudo systemctl status ypi-chatbot

# View logs
sudo journalctl -u ypi-chatbot -f
```

---

### 7. Nginx Reverse Proxy (Optional)

```bash
sudo nano /etc/nginx/sites-available/ypi-chatbot
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name chatbot-api.yourdomain.com;

    location /api/v3/chatbot {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/ypi-chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 8. SSL Certificate (Optional but Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d chatbot-api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔐 Security Hardening

### 1. Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### 2. Rate Limiting (Nginx)

Add to nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=chatbot:10m rate=10r/s;

location /api/v3/chatbot {
    limit_req zone=chatbot burst=20 nodelay;
    # ... rest of config
}
```

### 3. Environment Variables

```bash
# Ensure .env is not world-readable
chmod 600 /var/www/ypi-chatbot/.env
chown www-data:www-data /var/www/ypi-chatbot/.env
```

---

## 📊 Monitoring

### 1. Log Monitoring

```bash
# Real-time logs
sudo tail -f /var/log/ypi-chatbot/output.log
sudo tail -f /var/log/ypi-chatbot/error.log

# Systemd logs
sudo journalctl -u ypi-chatbot -f
```

### 2. Health Check Endpoint

```bash
# Setup cron job for health check
crontab -e

# Add:
*/5 * * * * curl -f http://localhost:8001/api/v3/chatbot/health || systemctl restart ypi-chatbot
```

### 3. Database Monitoring

```bash
# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='ypi_alazhar_db';"

# Check table sizes
sudo -u postgres psql ypi_alazhar_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
cd /var/www/ypi-chatbot

# Backup database first
sudo -u postgres pg_dump ypi_alazhar_db > backup_$(date +%Y%m%d).sql

# Pull new code
git pull  # or upload new files

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl restart ypi-chatbot

# Check logs
sudo journalctl -u ypi-chatbot -n 50
```

### Update Form Configuration

```bash
# Edit config
nano /var/www/ypi-chatbot/form_config.json

# Restart service (to reload config)
sudo systemctl restart ypi-chatbot
```

No code changes needed! ✅

---

## 🗄️ Database Backup

### Automated Backup Script

```bash
sudo nano /usr/local/bin/backup-ypi-db.sh
```

**Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ypi-chatbot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump ypi_alazhar_db | gzip > $BACKUP_DIR/ypi_db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "ypi_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ypi_db_$DATE.sql.gz"
```

**Make executable and schedule:**
```bash
sudo chmod +x /usr/local/bin/backup-ypi-db.sh

# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-ypi-db.sh
```

---

## 📈 Scaling

### Horizontal Scaling

For high traffic, run multiple instances:

```bash
# Instance 1
python main_v3.py --port 8001

# Instance 2  
python main_v3.py --port 8002

# Instance 3
python main_v3.py --port 8003
```

**Nginx load balancing:**
```nginx
upstream ypi_chatbot {
    least_conn;
    server localhost:8001;
    server localhost:8002;
    server localhost:8003;
}

server {
    location /api/v3/chatbot {
        proxy_pass http://ypi_chatbot;
        # ... rest of config
    }
}
```

---

## 🐛 Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u ypi-chatbot -n 100

# Check file permissions
ls -la /var/www/ypi-chatbot

# Verify Python path
which python3.9
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql ypi_alazhar_db

# Check DATABASE_URL in .env
```

### High memory usage

```bash
# Check memory
free -h

# Reduce workers or add memory limit
# In systemd service file:
MemoryLimit=1G
```

---

## ✅ Deployment Checklist

- [ ] Server prepared (Python, PostgreSQL, Nginx)
- [ ] Database created and initialized
- [ ] `.env` configured with production values
- [ ] Application files uploaded
- [ ] Dependencies installed
- [ ] Database tables created
- [ ] Application tested manually
- [ ] Systemd service configured
- [ ] Service started and enabled
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup script configured
- [ ] Health check working
- [ ] Logs accessible
- [ ] Documentation updated

---

## 🎯 Post-Deployment

### Verify Deployment

```bash
# 1. Health check
curl https://chatbot-api.yourdomain.com/api/v3/chatbot/health

# 2. Create session
curl -X POST https://chatbot-api.yourdomain.com/api/v3/chatbot/session/new

# 3. Send test message
curl -X POST https://chatbot-api.yourdomain.com/api/v3/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-123","message":"Halo"}'

# 4. Check logs
sudo tail -f /var/log/ypi-chatbot/output.log
```

### Monitor First Week

- Check logs daily
- Monitor error rates
- Watch database size
- Verify backups running
- Test from different locations

---

## 📞 Support

For issues:
1. Check logs: `/var/log/ypi-chatbot/`
2. Check service status: `sudo systemctl status ypi-chatbot`
3. Check database: `sudo -u postgres psql ypi_alazhar_db`

---

**Deployment Guide Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
