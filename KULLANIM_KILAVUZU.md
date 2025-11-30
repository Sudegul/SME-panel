# 📘 SMA Panel - Kullanım Kılavuzu

## 📌 Proje Hakkında

**SMA Panel** ilaç firmaları için tasarlanmış bir satış performans takip ve raporlama sistemidir.

### 🎯 Temel Özellikler

✅ **Rol Tabanlı Erişim**: Admin, Manager ve Employee rolleri
✅ **Dashboard & Grafikler**: Günlük, Haftalık, Aylık, Yıllık raporlar
✅ **Ziyaret Takibi**: Doktor ve eczane ziyaretleri
✅ **Satış Raporları**: Gerçek zamanlı satış istatistikleri
✅ **Hedef Yönetimi**: Çalışan başarı hedefleri ve izleme
✅ **Case Yönetimi**: Sorun takibi ve çözüm sistemi
✅ **Filtreleme**: Çalışan, tarih ve dönem bazlı filtreleme

---

## 🚀 Kurulum

### 1️⃣ Backend Kurulumu (FastAPI + PostgreSQL)

#### PostgreSQL Database Oluşturma

```bash
# DataGrip veya psql ile database oluşturun
CREATE DATABASE demo_sma;
```

#### Backend Başlatma

```bash
cd backend

# Virtual environment oluştur ve aktif et
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# veya
venv\Scripts\activate  # Windows

# Paketleri kur
pip install -r requirements.txt

# .env dosyasını düzenle
nano .env
# DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/demo_sma

# Backend'i çalıştır
uvicorn app.main:app --reload --port 8000
```

✅ **Backend çalışıyor:** http://localhost:8000
✅ **API Dökümantasyonu:** http://localhost:8000/docs

---

### 2️⃣ Frontend Kurulumu (React + Vite)

```bash
cd frontend

# Paketleri kur
npm install

# Frontend'i çalıştır
npm run dev
```

✅ **Frontend çalışıyor:** http://localhost:5173

---

## 🔐 Giriş Bilgileri

### Demo Kullanıcılar

| Email | Şifre | Rol | Açıklama |
|-------|-------|-----|----------|
| `sema.ekinci@demo.com` | `password` | **Manager** | ✅ Tüm çalışanları görebilir |
| `zeynep.yilmaz@demo.com` | `password` | **Admin** | ✅ Tam yetki |
| `ahmet.kaya@demo.com` | `password` | **Employee** | ⚠️ Sadece kendini görebilir |
| `ayse.demir@demo.com` | `password` | **Employee** | ⚠️ Sadece kendini görebilir |

---

## 📊 Dashboard Kullanımı

### 🔹 Admin/Manager Paneli (Sema Ekinci)

**Sema Ekinci** olarak giriş yaptığınızda:

#### ✅ Filtreler

1. **Çalışan Seç**
   - "Tüm Çalışanlar" veya tek bir çalışan seçebilirsiniz
   - Seçilen çalışanın tüm verileri görüntülenir

2. **Dönem Seçimi**
   - **Bugün**: Sadece bugünün verileri
   - **Son 7 Gün**: Son 1 haftanın verileri
   - **Bu Ay**: Aybaşından bugüne kadar
   - **Bu Yıl**: Yılbaşından bugüne kadar

3. **Grafik Gruplaması**
   - **Günlük**: Her gün ayrı gösterir
   - **Haftalık**: Haftalara göre toplar
   - **Aylık**: Aylara göre toplar
   - **Yıllık**: Yıllara göre toplar

#### 📈 İstatistik Kartları

- **Toplam Ziyaret**: Seçili dönemdeki tüm ziyaretler
- **Toplam Satış**: Toplam gelir (₺)
- **Açık Case'ler**: Çözülmemiş sorunlar
- **Hedef Durumu**: Hedefe ulaşma yüzdesi

#### 📊 Grafikler

1. **Ziyaret Trendi** (Çizgi Grafik)
   - Zaman içinde ziyaret sayısı değişimi

2. **Satış Trendi** (Bar Grafik)
   - Zaman içinde gelir değişimi

3. **Ziyaret Tipleri** (Pasta Grafik)
   - Doktor vs Eczane ziyaretleri dağılımı

4. **Case Durumu** (Pasta Grafik)
   - Açık, Devam Eden, Kapalı case'ler

#### 🏆 En Başarılı Çalışanlar Tablosu

Seçili dönemde en çok satış yapan çalışanlar:
- Sıralama
- İsim
- Ziyaret Sayısı
- Satış Sayısı
- Toplam Gelir

---

### 🔹 Çalışan Paneli (Örnek: Ahmet Kaya)

**Ahmet Kaya** olarak giriş yaptığınızda:

- ⚠️ **Sadece kendi verilerini görür**
- ✅ Filtreler: Dönem ve Grafik gruplaması mevcut
- ✅ Kendi hedef durumunu görebilir
- ✅ Genel sıralamadaki yerini görebilir (#3 / 5 çalışan gibi)

---

## 🎨 Örnek Kullanım Senaryoları

### Senaryo 1: Günlük Rapor Görme (Sema Ekinci)

1. **Sema olarak giriş yap**: `sema.ekinci@demo.com`
2. **Filtreler:**
   - Çalışan: **Tüm Çalışanlar**
   - Dönem: **Bugün**
   - Grafik: **Günlük**
3. **Sonuç:** Bugün tüm çalışanların yaptığı ziyaret ve satışları görürsünüz

---

### Senaryo 2: Bir Çalışanın Aylık Performansı (Sema Ekinci)

1. **Sema olarak giriş yap**
2. **Filtreler:**
   - Çalışan: **Ahmet Kaya**
   - Dönem: **Bu Ay**
   - Grafik: **Günlük**
3. **Sonuç:** Ahmet'in bu ayki günlük bazda performansını görürsünüz

---

### Senaryo 3: Yıllık Satış Trendi Görme (Sema Ekinci)

1. **Sema olarak giriş yap**
2. **Filtreler:**
   - Çalışan: **Tüm Çalışanlar**
   - Dönem: **Bu Yıl**
   - Grafik: **Aylık**
3. **Sonuç:** Tüm çalışanların yıllık aylık satış trendini görürsünüz

---

### Senaryo 4: Çalışan Kendi Performansını Görüyor (Ahmet Kaya)

1. **Ahmet olarak giriş yap**: `ahmet.kaya@demo.com`
2. **Filtreler:**
   - Dönem: **Bu Ay**
   - Grafik: **Haftalık**
3. **Sonuç:**
   - Sadece kendi verilerini görür
   - Hedefine ne kadar yaklaştığını görür
   - Genel sıralamadaki yerini görür (#3 / 5)

---

## 🔧 API Kullanımı (Geliştiriciler İçin)

### 🔐 Authentication

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sema.ekinci@demo.com", "password": "password"}'

# Response
{
  "access_token": "eyJhbG...",
  "token_type": "bearer"
}
```

### 📊 Dashboard Endpoints

```bash
# İstatistikler
curl -X GET "http://localhost:8000/dashboard/stats?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Ziyaret Grafiği
curl -X GET "http://localhost:8000/dashboard/visits-chart?group_by=day&start_date=2024-11-01&end_date=2024-11-24" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Satış Grafiği
curl -X GET "http://localhost:8000/dashboard/sales-chart?group_by=week" \
  -H "Authorization: Bearer YOUR_TOKEN"

# En İyi Çalışanlar
curl -X GET "http://localhost:8000/dashboard/top-employees?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Çalışan Sıralaması
curl -X GET "http://localhost:8000/dashboard/employee-ranking" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 Proje Yapısı

```
SMA_Panel/
├── backend/
│   ├── app/
│   │   ├── models/         # Database modelleri
│   │   ├── routers/        # API endpoint'leri
│   │   ├── schemas/        # Pydantic şemaları
│   │   ├── utils/          # Yardımcı fonksiyonlar
│   │   ├── config.py       # Konfigürasyon
│   │   ├── database.py     # Database bağlantısı
│   │   └── main.py         # Ana uygulama
│   ├── .env                # Environment variables
│   └── requirements.txt    # Python paketleri
│
└── frontend/
    ├── src/
    │   ├── api/            # API client
    │   ├── components/     # React bileşenleri
    │   ├── context/        # Context API (Auth)
    │   ├── pages/          # Sayfalar
    │   ├── App.jsx         # Ana uygulama
    │   └── main.jsx        # Giriş noktası
    └── package.json        # NPM paketleri
```

---

## 🐛 Sorun Giderme

### Backend Çalışmıyor

```bash
# PostgreSQL çalışıyor mu kontrol et
psql -U postgres -c "SELECT version();"

# .env dosyasını kontrol et
cat backend/.env

# Paketleri yeniden kur
pip install -r requirements.txt

# Database migration
python backend/init_db.py
```

### Frontend Çalışmıyor

```bash
# Node modüllerini temizle
cd frontend
rm -rf node_modules package-lock.json
npm install

# Porta başka bir uygulama takılmış olabilir
lsof -ti:5173 | xargs kill -9
```

### CORS Hatası

Backend `app/config.py` dosyasında CORS ayarlarını kontrol edin:

```python
BACKEND_CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
```

---

## 🎓 Sonuç

✅ **Backend:** FastAPI + PostgreSQL
✅ **Frontend:** React + Vite + TailwindCSS
✅ **Grafikler:** Recharts
✅ **Auth:** JWT Token

🎉 **Proje hazır! İyi kullanımlar!**

---

## 📞 İletişim & Destek

Herhangi bir sorun için GitHub Issues kullanabilirsiniz.
