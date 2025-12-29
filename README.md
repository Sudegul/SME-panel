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

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - İlişkisel veritabanı
- **SQLAlchemy** - ORM
- **JWT** - Authentication
- **Pydantic** - Data validation

### Frontend
- **Next.js 15** - React framework (App Router)
- **TypeScript** - Type safety
- **TailwindCSS** - Modern styling
- **Recharts** - Grafikler
- **Axios** - HTTP client
- **React Toastify** - Bildirimler

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

## 🚀 Sunucuya Yükleme (Production)

### Refactoring Gerekir Mi?

**HAYIR!** Sistem tamamen otomatiktir:
- ✅ Manager web arayüzünden kullanıcı ekler/çıkarır
- ✅ Pasif kullanıcılar otomatik olarak giriş yapamaz
- ✅ Tüm veriler korunur (soft delete)
- ✅ Filtreleme otomatik çalışır

**Yazılımcı müdahalesi GEREKMEZ!**

### Production için Değişiklikler:

#### Backend (`.env`):
```env
DATABASE_URL=postgresql://user:password@localhost/sma_panel
SECRET_KEY=your-super-secret-key-change-this-to-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=production
```

#### Frontend (`frontend/lib/axios.ts`):
```typescript
// API URL'sini production sunucunuza göre değiştirin
baseURL: 'https://api.yourdomain.com'
```

#### CORS Ayarları (`backend/app/main.py`):
```python
# Sadece kendi domain'inizden gelen isteklere izin verin
origins = [
    "https://yourdomain.com",
]
```

### Önerilen Stack:
- **Frontend**: Vercel / Netlify / Nginx
- **Backend**: Gunicorn + Uvicorn workers
- **Database**: PostgreSQL 14+
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (certbot)
- **Backup**: Günlük PostgreSQL dump

### Deployment Komutları:

#### Backend (systemd service):
```bash
# /etc/systemd/system/sma-backend.service
[Unit]
Description=SMA Panel Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/sma-panel/backend
Environment="PATH=/var/www/sma-panel/backend/venv/bin"
ExecStart=/var/www/sma-panel/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

#### Frontend (Next.js):
```bash
npm run build
npm start
# veya
# Vercel'e deploy: vercel --prod
```

### Veri Güvenliği:
- ✅ Şifreler bcrypt ile hash'lenir
- ✅ JWT token authentication
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Pasif kullanıcılar giriş yapamaz
- ✅ HTTPS kullanımı zorunludur (production)
- ✅ SQL injection koruması (SQLAlchemy ORM)
- ✅ XSS koruması (React)

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
