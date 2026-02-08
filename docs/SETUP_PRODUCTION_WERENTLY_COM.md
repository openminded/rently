# PANDUAN SETUP PRODUCTION (werently.com)

Panduan ini untuk men-setup environment Production baru di domain `werently.com` pada server AA Panel yang sama, terpisah dari Staging (`werently.telaju.com`).

---

## 🏗️ 1. Persiapan Server (AA Panel)

### A. Buat Website Baru
1.  Login ke AA Panel.
2.  Menu **Website** > **Add Site**.
3.  Domain: `werently.com`
4.  Database: Buat database baru.
    *   DB Name: `prod_wrnt`
    *   User: `ShT2twTxBfRE6N48`
    *   Password: (Simpan password yang digenerate AA Panel)
5.  PHP Version: Pure Static (karena kita pakai Node.js).
6.  Submit.

### B. Clone Repository
Buka Terminal di AA Panel (atau SSH), lalu jalankan perintah ini:

```bash
# 1. Masuk ke folder root website
cd /www/wwwroot/werently.com

# 2. Hapus file default (index.html dll)
rm -rf ./*

# 3. Clone repository (Pastikan SSH Key sudah ada di Github)
git clone git@github.com:username/repo-name.git . 
# GANTI URL DI ATAS DENGAN URL GIT REPO ANDA!

# 4. Masuk ke folder server
cd server
```

---

## ⚙️ 2. Konfigurasi Backend (Server)

### A. Buat File `.env`
Di dalam folder `/www/wwwroot/werently.com/server`, buat file bernama `.env` dan isi dengan konfigurasi berikut:

```ini
# Database (Gunakan password dari AA Panel tadi)
DATABASE_URL="mysql://ShT2twTxBfRE6N48:PASSWORD_DB_DARI_AAPANEL@127.0.0.1:3306/prod_wrnt"

# Port Baru (BEDA DARI STAGING)
PORT=3006

# Keamanan (Random String Baru)
JWT_SECRET="prod_secret_8x92m3k4j5h6g7f8d9s0a1q2w3e4r5t6"

# Duitku (Sama dengan Staging / Boleh beda jika ada akun lain)
DUITKU_MERCHANT_CODE=DS27878
DUITKU_API_KEY=d10b6ff2020b8c294691b0af14535975
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://werently.com/api/payments/duitku/callback
DUITKU_RETURN_URL=https://werently.com/transactions
DUITKU_EXPIRY_PERIOD=1440

# Upload Path
UPLOAD_DIR=/www/wwwroot/werently.com/server/uploads
```

### B. Beri Izin Eksekusi Script
Agar script deploy bisa jalan:

```bash
chmod +x deploy_prod.sh
chmod +x deploy_frontend_prod.sh
```

### C. Install & Setup Database Awal
Jalankan perintah ini **sekali saja** di awal untuk setup database:

```bash
# Install dependency
npm ci

# Push schema ke database baru (prod_wrnt)
npx prisma db push

# (Opsional) Seed data awal jika perlu admin default
npx prisma db seed
```

---

## 🚀 3. Jalankan Aplikasi (Backend)

Gunakan script deploy khusus production yang baru dibuat:

```bash
./deploy_prod.sh
```

*Script ini akan otomatis menjalankan aplikasi dengan nama `werently-prod` di port `3006`.*

---

## 🌐 4. Setup Reverse Proxy (Nginx)

Agar `werently.com/api` mengarah ke port 3006.

1.  Di AA Panel, buka setting website `werently.com`.
2.  Masuk ke **Config** (atau **Reverse Proxy** jika ingin simpel, tapi Config lebih fleksibel).
3.  Tambahkan blok ini di dalam `server { ... }`:

```nginx
    # Proxy untuk API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3006; # Port Production
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy untuk Gambar/Uploads
    location /uploads/ {
        alias /www/wwwroot/werently.com/server/uploads/;
    }
```

---

## 🎨 5. Deploy Frontend

Jalankan script build frontend khusus production:

```bash
./deploy_frontend_prod.sh
```

**PENTING:**
Pastikan **Site Directory** di setting website AA Panel mengarah ke:
`/www/wwwroot/werently.com/client/dist`

Selesai! Sekarang `werently.com` adalah Production (Port 3006, DB `prod_wrnt`), dan `werently.telaju.com` tetap Staging (Port 3005).
