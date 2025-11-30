<<<<<<< HEAD
# 🚀 SMA Panel - Satış Yönetim Sistemi

İlaç firmaları için geliştirilmiş modern satış performans takip ve raporlama platformu.

## ✨ Özellikler

- 📊 **Gerçek Zamanlı Dashboard**: Günlük, haftalık, aylık ve yıllık raporlar
- 👥 **Rol Tabanlı Erişim**: Admin, Manager ve Employee rolleri
- 📈 **İnteraktif Grafikler**: Ziyaret ve satış trendleri
- 🎯 **Hedef Takibi**: Çalışan performans hedefleri
- 🏆 **Sıralama Sistemi**: En başarılı çalışanlar
- 🔍 **Gelişmiş Filtreleme**: Çalışan, tarih ve dönem bazlı

## 🛠️ Teknolojiler

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - İlişkisel veritabanı
- **SQLAlchemy** - ORM
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Recharts** - Grafikler
- **Axios** - HTTP client

## 🚀 Hızlı Başlangıç

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env dosyasını düzenle
DATABASE_URL=postgresql://user:pass@localhost:5432/demo_sma

# Başlat
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Demo Giriş

| Email | Şifre | Rol |
|-------|-------|-----|
| `sema.ekinci@demo.com` | `password` | Manager (Tüm erişim) |
| `ahmet.kaya@demo.com` | `password` | Employee (Kendi verileri) |

## 👥 Kullanıcı Yönetimi (ÖNEMLİ!)

### Kullanıcı Ekleme/Çıkarma

Manager'lar **web arayüzünden** kullanıcı yönetimi yapabilir. **Yazılımcı müdahalesine gerek yoktur!**

#### Yeni Kullanıcı Ekleme:
1. Manager hesabıyla giriş yap
2. **Kullanıcılar** sayfasına git (`/users`)
3. "Yeni Kullanıcı Ekle" butonuna tıkla
4. Formu doldur (Ad Soyad, Email, Şifre, Rol, Telefon)
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

### Filtreleme
- **Aktif Kullanıcılar**: Şu an çalışanlar
- **Pasif Kullanıcılar**: Ayrılmış çalışanlar
- **Tümü**: Tüm kullanıcılar

## 📚 Dokümantasyon

Detaylı kullanım kılavuzu için: [KULLANIM_KILAVUZU.md](./KULLANIM_KILAVUZU.md)

## 🌐 Erişim

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

## 📸 Screenshots

Dashboard, grafikler ve raporlama özellikleriyle tam donanımlı!

## 🎯 Kullanım Senaryoları

1. **Manager (Sema)**: Tüm çalışanları görebilir, filtreleyebilir
2. **Employee (Ahmet)**: Sadece kendi performansını görebilir
3. **Filtreler**: Gün/Hafta/Ay/Yıl bazında analiz
4. **Grafikler**: Ziyaret ve satış trendleri
5. **Hedefler**: Gerçekleşme oranları

## 🚀 Sunucuya Yükleme (Production)

### Refactoring Gerekir Mi?

**HAYIR!** Sistem tamamen otomatiktir:
- ✅ Manager web arayüzünden kullanıcı ekler/çıkarır
- ✅ Pasif kullanıcılar otomatik olarak giriş yapamaz
- ✅ Tüm veriler korunur (soft delete)
- ✅ Filtreleme otomatik çalışır

**Yazılımcı müdahalesi GEREKMEZ!**

### Production için Değişiklikler:

#### Backend (`backend/app/config.py`):
```python
# PostgreSQL kullan (SQLite yerine)
DATABASE_URL = "postgresql://user:password@localhost/sma_panel"

# Güçlü secret key oluştur
SECRET_KEY = "your-super-secret-key-change-this"

# Token süresi (dakika)
ACCESS_TOKEN_EXPIRE_MINUTES = 60
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
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (certbot)
- **Backup**: Günlük PostgreSQL dump

### Veri Güvenliği:
- ✅ Şifreler bcrypt ile hash'lenir
- ✅ JWT token authentication
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Pasif kullanıcılar giriş yapamaz
- ✅ HTTPS kullanımı önerilir

## 📄 Lisans

Bu proje demo amaçlı geliştirilmiştir.
=======
# personal-panel
Personal admin panel.
>>>>>>> 9e9f891128081ce1ce257942872f84de1ea773a8
