# 🚀 SMA Panel - Satış Yönetim Sistemi

İlaç firmaları için geliştirilmiş modern satış performans takip ve raporlama platformu.

## ✨ Özellikler

- 📊 **Gerçek Zamanlı Dashboard**: Günlük, haftalık, aylık ve yıllık raporlar
- 👥 **Rol Tabanlı Erişim**: Admin, Manager ve Employee rolleri
- 📈 **İnteraktif Grafikler**: Ziyaret ve satış trendleri
- 🎯 **Hedef Takibi**: Çalışan performans hedefleri
- 🏆 **Sıralama Sistemi**: En başarılı çalışanlar
- 🔍 **Gelişmiş Filtreleme**: Çalışan, tarih ve dönem bazlı
- 🏖️ **İzin Yönetimi**: Çalışan izinlerini takip ve onaylama
- 📅 **Haftalık Program**: Çalışanların haftalık ziyaret programları
- 🏥 **Eczane Yönetimi**: Eczane bilgilerini kaydetme ve takip
- 📋 **Durum Raporları**: Detaylı çalışan durum raporlama

## 🛠️ Teknolojiler

### Frontend
- **Framework:** Next.js 14.2.21 (React 18.3.1)
- **Dil:** TypeScript 5.7.2
- **Styling:** Tailwind CSS 3.4.0
- **State Management:** SWR 2.3.8 (React Hooks for data fetching)
- **HTTP Client:** Axios 1.7.9
- **UI Kütüphaneleri:**
  - Lucide React 0.468.0 (Icons)
  - React Toastify 11.0.5 (Notifications)
  - Recharts 2.15.0 (Charts/Graphs)
  - date-fns 4.1.0 (Date manipulation)
  - xlsx 0.18.5 (Excel export/import)

### Backend
- **Framework:** FastAPI 0.115.0
- **Server:** Uvicorn 0.32.0 (ASGI server)
- **Database:** PostgreSQL + SQLAlchemy 2.0.23 (ORM)
- **Authentication:** JWT (python-jose 3.3.0 + passlib 1.7.4 + bcrypt 4.1.2)
- **Data Validation:** Pydantic 2.9.0 + pydantic-settings 2.6.0
- **Utilities:** python-multipart, python-dotenv

### DevOps
- Docker + Docker Compose
- Standalone Next.js build (output: 'standalone')

## 🚀 Hızlı Başlangıç

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env dosyasını oluştur ve düzenle
DATABASE_URL=postgresql://user:pass@localhost:5432/sma_panel
SECRET_KEY=your-secret-key-here

# Veritabanını oluştur
# PostgreSQL'de sma_panel adında bir database oluşturun

# Başlat
uvicorn app.main:app --reload
```

Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## 🔐 Demo Giriş Bilgileri

| Email | Şifre | Rol |
|-------|-------|-----|
| `sema.ekinci@demo.com` | `password` | Manager (Tüm erişim) |
| `ahmet.kaya@demo.com` | `password` | Employee (Kendi verileri) |

## 📚 Kullanım Kılavuzları

Detaylı kullanım kılavuzları için:

- 👔 **[Manager Kullanım Kılavuzu](./MANAGER_GUIDE.md)** - Yöneticiler için detaylı kılavuz
- 👤 **[Employee Kullanım Kılavuzu](./EMPLOYEE_GUIDE.md)** - Çalışanlar için detaylı kılavuz

## 🎯 Temel Modüller

### 1. Dashboard
- Günlük/Haftalık/Aylık/Yıllık performans metrikleri
- Toplam ziyaret ve satış rakamları
- İnteraktif grafikler ve trendler
- En başarılı çalışanlar sıralaması

### 2. İzin Yönetimi
- İzin talebi oluşturma
- İzin bakiyesi görüntüleme
- Yönetici onayı sistemi
- Geçmiş tarihli izin kontrolleri
- Aktif izin takibi
- Excel export özelliği

### 3. Haftalık Program
- Haftalık ziyaret programı oluşturma
- Eczane ataması
- Program görüntüleme ve düzenleme
- Haftalık bazda filtreleme

### 4. Eczane Yönetimi
- Eczane ekleme/düzenleme
- Lokasyon bilgileri
- İletişim detayları
- Arama ve filtreleme

### 5. Durum Raporları
- Günlük durum raporları
- Ziyaret ve satış takibi
- Detaylı notlar
- Tarih bazlı filtreleme

### 6. Kullanıcı Yönetimi (Manager)
- Kullanıcı ekleme/düzenleme
- Rol ve yetki yönetimi
- Aktif/Pasif kullanıcı durumu
- Soft delete sistemi

## 👥 Rol Bazlı Erişim

### Admin
- Tüm sistem ayarları
- Kullanıcı yönetimi
- İzin türleri yönetimi
- Global ayarlar

### Manager
- Tüm çalışanların verilerini görüntüleme
- İzin onaylama/reddetme
- Kullanıcı yönetimi
- Raporlama ve filtreleme
- Eczane yönetimi

### Employee
- Kendi verilerini görüntüleme
- İzin talebi oluşturma
- Haftalık program girişi
- Durum raporu ekleme
- Kendi performans metriklerini takip

## 🔐 Kullanıcı Yönetimi (ÖNEMLİ!)

### Kullanıcı Ekleme/Çıkarma

Manager'lar **web arayüzünden** kullanıcı yönetimi yapabilir. **Yazılımcı müdahalesine gerek yoktur!**

#### Yeni Kullanıcı Ekleme:
1. Manager hesabıyla giriş yap
2. **Ayarlar** sayfasına git
3. "Yeni Çalışan Ekle" butonuna tıkla
4. Formu doldur (Ad Soyad, Email, Şifre, Rol, vb.)
5. "Ekle" butonuna tıkla

#### Kullanıcı Pasif Yapma (Soft Delete):
- Kullanıcılar **SİLİNMEZ**, sadece **pasif** hale getirilir
- Pasif kullanıcılar:
  - ❌ Giriş yapamaz
  - ✅ Tüm geçmiş verileri korunur
  - ✅ Raporlarda görünür
  - ✅ İstenirse tekrar aktif yapılabilir

**Kullanıcı Durumları:**
- `is_active = True` (Aktif): Normal kullanıcı, giriş yapabilir
- `is_active = False` (Pasif): Eski çalışan, giriş yapamaz ama verileri korunur

## 🌐 Erişim

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

## 🐋 Docker Mekanizması ve Deployment

### Docker Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                   SUNUCU (VM/Server)                    │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Frontend        │  Docker │  Backend         │     │
│  │  Container       │  Network│  Container       │     │
│  │                  │◄────────┤                  │     │
│  │  Next.js:3000    │         │  FastAPI:8000    │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                            │                │
│           │ Port Mapping               │                │
│           │ 3000:3000                  │ 8000:8000      │
│           ▼                            ▼                │
│  ┌─────────────────────────────────────────────┐        │
│  │         Sunucunun Dış Portları              │        │
│  │  http://sunucu-ip:3000  (Frontend)          │        │
│  │  http://sunucu-ip:8000  (Backend API)       │        │
│  └─────────────────────────────────────────────┘        │
│                                       │                 │
│                              host.docker.internal       │
│                                       ▼                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  PostgreSQL (Sunucuda Direkt Çalışıyor)     │       │
│  │  Port: 5432                                  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Servis Yapısı

**Frontend ve Backend ayrı Docker container'ları olarak çalışır:**

**✅ Avantajları:**
- Bağımsız ölçeklendirme (Frontend 3x, Backend 5x)
- Bağımsız güncelleme (Sadece backend'i restart)
- İzolasyon (Bir crash diğerini etkilemez)
- Teknoloji bağımsızlığı (Node.js vs Python base image'ları)

### Network İletişimi

**Container ↔ Container (Docker Network içi):**
```
Frontend → Backend: http://backend:8000
```
- Docker Compose otomatik olarak servis isimlerini DNS olarak tanır
- `backend` servisi → `backend` hostname'i ile erişilebilir

**Kullanıcı ↔ Container (Port Mapping):**
```
http://sunucu-ip:3000  →  Frontend Container (port 3000:3000)
http://sunucu-ip:8000  →  Backend Container (port 8000:8000)
```

**Container ↔ Host PostgreSQL:**
```
Backend → host.docker.internal:5432
```
- `host.docker.internal`: Docker'ın özel DNS'i
- Container'dan host makinenin localhost'una erişim sağlar

### Ortam Karşılaştırması

| Ne? | Local (Development) | Sunucu (Docker) |
|-----|---------------------|-----------------|
| **Backend Çalışma** | `uvicorn app.main:app` | Docker Container |
| **Frontend Çalışma** | `npm run dev` | Docker Container |
| **PostgreSQL** | localhost:5432 | Sunucuda localhost:5432 |
| **Frontend → Backend** | http://localhost:8000 | http://backend:8000 |
| **Backend → PostgreSQL** | localhost:5432 | host.docker.internal:5432 |
| **Kullanıcı Erişimi** | localhost:3000 | sunucu-ip:3000 |

### Docker Komutları

**Container Yönetimi:**
```bash
# Container'ları başlat
docker compose up -d

# Container'ları durdur
docker compose down

# Belirli bir servisi yeniden başlat
docker compose restart backend
docker compose restart frontend

# Sadece backend'i rebuild et
docker compose up -d --build backend

# Kodu güncelledikten sonra
docker compose up -d --build
```

**Log İzleme:**
```bash
# Tüm log'lar
docker compose logs -f

# Belirli bir servisin log'u
docker compose logs -f backend
docker compose logs -f frontend

# Son 100 satır
docker compose logs --tail=100
```

**Container İçine Giriş:**
```bash
# Backend container'ına giriş
docker exec -it sme_panel_backend bash

# Frontend container'ına giriş
docker exec -it sme_panel_frontend sh
```

### Deployment Adımları

#### 1. Sunucuda Hazırlık
```bash
# PostgreSQL'in çalıştığından emin olun
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Docker kurulumunu kontrol edin
docker --version
docker compose version
```

#### 2. Environment Variables
```bash
# Backend .env dosyasını düzenleyin
cd backend
nano .env

# Önemli değişkenler:
POSTGRES_HOST=localhost  # Docker'da: host.docker.internal
POSTGRES_PASSWORD=güvenli-şifre  # ⚠️ Değiştirin!
SECRET_KEY=min-32-karakter-güçlü-key  # ⚠️ Değiştirin!
BACKEND_CORS_ORIGINS=https://yourdomain.com
```

```bash
# Frontend .env dosyası (zaten oluşturulmuş)
# Docker Compose içinde otomatik override edilir:
# NEXT_PUBLIC_API_URL=http://backend:8000
```

#### 3. Docker ile Başlatma
```bash
# Build ve başlat
docker compose up -d --build

# Log'ları izle
docker compose logs -f

# Sağlık kontrolü
docker compose ps
curl http://localhost:8000/docs
curl http://localhost:3000
```

### Production Güvenlik Checklist

⚠️ **Mutlaka Değiştirin:**
- [ ] PostgreSQL şifresi (güçlü, rastgele)
- [ ] JWT SECRET_KEY (minimum 32 karakter)
- [ ] CORS origins (sadece production domain)
- [ ] Environment files permission: `chmod 600 backend/.env`
- [ ] SSL/TLS sertifikası (Let's Encrypt)
- [ ] Firewall kuralları (3000, 8000 portları)
- [ ] Backup stratejisi (günlük PostgreSQL dump)

### Veri Güvenliği
- ✅ Şifreler bcrypt ile hash'lenir
- ✅ JWT token authentication
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Pasif kullanıcılar giriş yapamaz
- ✅ HTTPS kullanımı (production)
- ✅ SQL injection koruması (SQLAlchemy ORM)
- ✅ XSS koruması (React)
- ✅ Environment variables güvenliği

### Detaylı Deployment Kılavuzu

Daha detaylı deployment talimatları için [DOCKER_SETUP.md](DOCKER_SETUP.md) dosyasına bakın.

## 🐛 Sorun Giderme

### Backend başlamıyor:
```bash
# Veritabanı bağlantısını kontrol edin
psql -U user -d sma_panel

# Requirements güncel mi?
pip install -r requirements.txt --upgrade
```

### Frontend hata veriyor:
```bash
# Node_modules'u temizle
rm -rf node_modules package-lock.json
npm install

# Cache'i temizle
rm -rf .next
npm run dev
```

### Veritabanı migration:
```bash
# Alembic kullanarak migration
cd backend
alembic upgrade head
```

## 📊 Proje Yapısı

```
SMA_Panel/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── crud/           # CRUD operations
│   │   ├── core/           # Core utilities
│   │   └── main.py         # Main application
│   ├── requirements.txt
│   └── .env
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js 15 app router
│   │   ├── (dashboard)/   # Dashboard pages
│   │   ├── login/         # Login page
│   │   └── layout.tsx
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   ├── contexts/         # React contexts
│   └── package.json
│
├── MANAGER_GUIDE.md       # Manager kullanım kılavuzu
├── EMPLOYEE_GUIDE.md      # Employee kullanım kılavuzu
└── README.md             # Bu dosya
```

## 🤝 Katkıda Bulunma

Bu proje şu an demo amaçlıdır. Önerileriniz için issue açabilirsiniz.

## 📄 Lisans

Bu proje demo amaçlı geliştirilmiştir.

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not:** Production ortamında mutlaka güvenlik best practice'lerini uygulayın:
- Güçlü SECRET_KEY kullanın
- HTTPS kullanın
- Düzenli backup alın
- Log monitoring yapın
- Rate limiting ekleyin
